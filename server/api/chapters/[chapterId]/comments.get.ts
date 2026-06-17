import prisma from '~/server/utils/prisma'
import { commentFilters } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const chapterId = Number(event.context.params?.chapterId)
  const query = getQuery(event)
  const paragraphParam = query.paragraph

  if (!chapterId || isNaN(chapterId)) {
    throw createError({
      statusCode: 400,
      message: '无效的章节ID'
    })
  }

  let where
  if (paragraphParam === 'all') {
    where = commentFilters.allParagraphComments(chapterId)
  } else if (paragraphParam !== undefined) {
    const paragraph = Number(paragraphParam)
    if (isNaN(paragraph)) {
      throw createError({
        statusCode: 400,
        message: '无效的段落索引'
      })
    }
    where = commentFilters.paragraphComments(chapterId, paragraph)
  } else {
    where = commentFilters.chapterComments(chapterId)
  }

  const comments = await prisma.comment.findMany({
    where,
    include: {
      user: {
        select: { id: true, username: true, avatar: true }
      },
      replies: {
        include: {
          user: {
            select: { id: true, username: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return { comments }
})
