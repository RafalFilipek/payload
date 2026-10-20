/**
 * afterDelete Hook Responsibilities:
 * - Remove references to the deleted hierarchy item from related documents and their versions
 *
 * Writes go straight to the database adapter instead of through `payload.update`: a full update
 * would replace pending drafts with the published content and create new versions just because a
 * referenced item was deleted. SQL adapters already drop these references through foreign keys,
 * so this mainly matters for adapters without them (MongoDB).
 */

import type { CollectionAfterDeleteHook } from '../../index.js'
import type { SanitizedHierarchyRelatedCollection } from '../types.js'

import { extractID } from '../../utilities/extractID.js'

type Args = {
  /**
   * Map of collection slugs to their hierarchy field info
   */
  relatedCollections: Record<string, SanitizedHierarchyRelatedCollection>
}

export const hierarchyCollectionAfterDelete =
  ({ relatedCollections }: Args): CollectionAfterDeleteHook =>
  async ({ id, req }) => {
    for (const [collectionSlug, { fieldName, hasMany }] of Object.entries(relatedCollections)) {
      await req.payload.db.updateMany({
        collection: collectionSlug,
        data: {
          [fieldName]: hasMany ? { $remove: id } : null,
        },
        req,
        returning: false,
        where: {
          [fieldName]: {
            equals: id,
          },
        },
      })

      if (!req.payload.collections[collectionSlug]?.config.versions) {
        continue
      }

      const { docs: versions } = await req.payload.db.findVersions({
        collection: collectionSlug,
        pagination: false,
        req,
        where: {
          [`version.${fieldName}`]: {
            equals: id,
          },
        },
      })

      for (const { id: versionID, updatedAt, version } of versions) {
        const value = version[fieldName]

        await req.payload.db.updateVersion({
          id: versionID,
          collection: collectionSlug,
          req,
          returning: false,
          versionData: {
            // Keep the timestamp so the order of versions and the draft status stay unchanged
            updatedAt,
            version: {
              ...version,
              [fieldName]:
                hasMany && Array.isArray(value)
                  ? value.filter((relation) => String(extractID(relation)) !== String(id))
                  : null,
            },
          },
        })
      }
    }
  }
