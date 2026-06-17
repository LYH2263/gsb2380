import prisma from '~/server/utils/prisma'
import { commentFilters } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const chapterId = Number(event.context.params?.chapterId)
  const query = getQuery(event)
  const paragraph = query.paragraph ? Number(query.paragraph) : undefined
  const allParagraphs = query.allParagraphs === 'true'

  if (!chapterId || isNaN(chapterId)) {
    throw createError({
      statusCode: 400,
      message: '无效的章节ID'
    })
  }

  let typeFilter
  if (paragraph !== undefined) {
    typeFilter = commentFilters.paragraphComments(paragraph)
  } else if (allParagraphs) {
    typeFilter = commentFilters.allParagraphComments
  } else {
    typeFilter = commentFilters.chapterComments
  }

  const where = {
    chapterId,
    ...typeFilter
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
