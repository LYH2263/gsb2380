import prisma from '~/server/utils/prisma'
import { commentFilters } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const chapterId = Number(event.context.params?.chapterId)
  const query = getQuery(event)
  const paragraph = query.paragraph !== undefined ? Number(query.paragraph) : null
  const allParagraphs = query.allParagraphs === 'true'

  if (!chapterId || isNaN(chapterId)) {
    throw createError({
      statusCode: 400,
      message: '无效的章节ID'
    })
  }

  const where = {
    chapterId,
    parentId: null,
    ...commentFilters.buildWhere({
      paragraph: allParagraphs ? undefined : paragraph,
      allParagraphs
    })
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
