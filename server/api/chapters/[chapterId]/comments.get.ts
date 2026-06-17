import prisma from '~/server/utils/prisma'
import { chapterCommentWhere, paragraphCommentWhere } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const chapterId = Number(event.context.params?.chapterId)
  const query = getQuery(event)
  const paragraph = query.paragraph ? Number(query.paragraph) : undefined

  if (!chapterId || isNaN(chapterId)) {
    throw createError({
      statusCode: 400,
      message: '无效的章节ID'
    })
  }

  const where = paragraph !== undefined
    ? paragraphCommentWhere(chapterId, paragraph)
    : chapterCommentWhere(chapterId)

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
