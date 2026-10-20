import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

const tagsSlug = 'tags'
const categoriesSlug = 'categories'
const postsSlug = 'posts'
const draftPostsSlug = 'draft-posts'

test.suite('Deleting a tag', { config: './config.ts' }, () => {
  test('should keep other tags on a document when one of its tags is deleted', async ({
    payload,
  }) => {
    const tagA = await payload.create({
      collection: tagsSlug,
      data: { name: 'Tag A' },
      overrideAccess: true,
    })
    const tagB = await payload.create({
      collection: tagsSlug,
      data: { name: 'Tag B' },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: postsSlug,
      data: { _h_tags: [tagA.id, tagB.id], title: 'Post' },
      overrideAccess: true,
    })

    await payload.delete({ collection: tagsSlug, id: tagA.id, overrideAccess: true })

    const updatedPost = await payload.findByID({
      collection: postsSlug,
      depth: 0,
      id: post.id,
      overrideAccess: true,
    })

    expect(updatedPost._h_tags).toEqual([tagB.id])
  })

  test('should clear a single-select tag on a document when it is deleted', async ({ payload }) => {
    const category = await payload.create({
      collection: categoriesSlug,
      data: { name: 'Category' },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: postsSlug,
      data: { _h_categories: category.id, title: 'Post' },
      overrideAccess: true,
    })

    await payload.delete({ collection: categoriesSlug, id: category.id, overrideAccess: true })

    const updatedPost = await payload.findByID({
      collection: postsSlug,
      depth: 0,
      id: post.id,
      overrideAccess: true,
    })

    expect(updatedPost._h_categories).toBeNull()
  })

  test('should not publish a pending draft when a tag of the document is deleted', async ({
    payload,
  }) => {
    const tagA = await payload.create({
      collection: tagsSlug,
      data: { name: 'Tag A' },
      overrideAccess: true,
    })
    const tagB = await payload.create({
      collection: tagsSlug,
      data: { name: 'Tag B' },
      overrideAccess: true,
    })
    const category = await payload.create({
      collection: categoriesSlug,
      data: { name: 'Category' },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: draftPostsSlug,
      data: {
        _h_categories: category.id,
        _h_tags: [tagA.id, tagB.id],
        _status: 'published',
        title: 'Published title',
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: draftPostsSlug,
      data: { title: 'Draft title' },
      draft: true,
      id: post.id,
      overrideAccess: true,
    })

    await payload.delete({ collection: tagsSlug, id: tagA.id, overrideAccess: true })
    await payload.delete({ collection: categoriesSlug, id: category.id, overrideAccess: true })

    const published = await payload.findByID({
      collection: draftPostsSlug,
      depth: 0,
      id: post.id,
      overrideAccess: true,
    })
    const draft = await payload.findByID({
      collection: draftPostsSlug,
      depth: 0,
      draft: true,
      id: post.id,
      overrideAccess: true,
    })

    expect({ draft, published }).toMatchObject({
      draft: {
        _h_categories: null,
        _h_tags: [tagB.id],
        _status: 'draft',
        title: 'Draft title',
      },
      published: {
        _h_categories: null,
        _h_tags: [tagB.id],
        _status: 'published',
        title: 'Published title',
      },
    })
  })

  test('should keep the latest content of a never published document when its tag is deleted', async ({
    payload,
  }) => {
    const tagA = await payload.create({
      collection: tagsSlug,
      data: { name: 'Tag A' },
      overrideAccess: true,
    })
    const tagB = await payload.create({
      collection: tagsSlug,
      data: { name: 'Tag B' },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: draftPostsSlug,
      data: { _h_tags: [tagA.id, tagB.id], title: 'First draft' },
      draft: true,
      overrideAccess: true,
    })
    await payload.update({
      collection: draftPostsSlug,
      data: { title: 'Second draft' },
      draft: true,
      id: post.id,
      overrideAccess: true,
    })

    await payload.delete({ collection: tagsSlug, id: tagA.id, overrideAccess: true })

    const draft = await payload.findByID({
      collection: draftPostsSlug,
      depth: 0,
      draft: true,
      id: post.id,
      overrideAccess: true,
    })

    expect(draft).toMatchObject({
      _h_tags: [tagB.id],
      _status: 'draft',
      title: 'Second draft',
    })
  })
})
