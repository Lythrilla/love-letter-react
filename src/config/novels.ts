export interface NovelChapter {
  title: string
  content: string
}

export interface Novel {
  id: string
  title: string
  author?: string
  description?: string
  chapters: NovelChapter[]
  createdAt?: string
}

export const NOVELS: Novel[] = [
  {
    id: 'first-story',
    title: '示例小说',
    author: '浩浩',
    description: '这是一个示例小说，你可以在这里写你的故事',
    createdAt: '2025-12-26',
    chapters: [
      {
        title: '第一章',
        content: `这里是第一章的内容。

你可以在这里写很长的故事。

支持多段落。`,
      },
      {
        title: '第二章',
        content: `第二章开始了。

继续你的故事...`,
      },
    ],
  },
]

export function getNovelById(id: string): Novel | undefined {
  return NOVELS.find(n => n.id === id)
}
