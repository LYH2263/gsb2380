import prisma from '~/server/utils/prisma'
import { chapterCommentWhere, paragraphCommentWhere } from '~/server/utils/validators'

export default defineEventHandler(async (event) => {
  const novelId = Number(event.context.params?.id)
  const chapterId = Number(event.context.params?.chapterId)

  if (!novelId || isNaN(novelId) || !chapterId || isNaN(chapterId)) {
    throw createError({
      statusCode: 400,
      message: '无效的参数'
    })
  }

  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      novelId
    },
    include: {
      novel: {
        select: {
          id: true,
          title: true,
          author: {
            select: { id: true, username: true, avatar: true }
          }
        }
      },
      comments: {
        where: chapterCommentWhere(chapterId),
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
      }
    }
  })

  if (!chapter) {
    throw createError({
      statusCode: 404,
      message: '章节不存在'
    })
  }

  const paragraphComments = await prisma.comment.findMany({
    where: paragraphCommentWhere(chapterId),
    include: {
      user: {
        select: { id: true, username: true, avatar: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // 获取相邻章节
  const [prevChapter, nextChapter] = await Promise.all([
    prisma.chapter.findFirst({
      where: {
        novelId,
        order: { lt: chapter.order }
      },
      orderBy: { order: 'desc' },
      select: { id: true, title: true, order: true }
    }),
    prisma.chapter.findFirst({
      where: {
        novelId,
        order: { gt: chapter.order }
      },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true }
    })
  ])

  return {
    ...chapter,
    paragraphComments,
    prevChapter,
    nextChapter
  }
})
