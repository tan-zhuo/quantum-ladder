import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { CHAPTER_BY_ID } from '@/data/chapters'
import { extractHeadings, mdxToPlainText, type SearchDoc } from '@/lib/search'

/**
 * 构建期生成搜索索引，输出到 /search-index.json。
 *
 * 只在用户第一次打开搜索框时才被下载——所以这里可以放得比较全，
 * 但正文仍截断到 4000 字：一节的核心概念都在前面，后面多半是练习与延伸阅读，
 * 全塞进去会让索引膨胀好几倍而基本不提升命中率。
 *
 * 两类文档共用一个索引：3D 模块（id 形如 `lab/05-spin`）排在前面，
 * 教材小节在后。首页的「继续学习」也靠这份索引把 id 还原成标题。
 */
export const GET: APIRoute = async () => {
  const entries = await getCollection('sections')
  const labs = await getCollection('lab')

  const labDocs: SearchDoc[] = labs
    .map((entry: { id: string; body?: string; data: Record<string, any> }) => {
      const source = entry.body ?? ''
      return {
        id: `lab/${entry.id}`,
        href: `${import.meta.env.BASE_URL}lab/${entry.id}/`.replace(/\/{2,}/g, '/'),
        label: `模块 ${entry.data.num}`,
        chapter: '3D 实验室',
        title: entry.data.title,
        summary: entry.data.goal ?? '',
        headings: extractHeadings(source),
        body: mdxToPlainText(source),
        status: entry.data.status ?? 'stub',
      }
    })
    .sort((a: SearchDoc, b: SearchDoc) => a.id.localeCompare(b.id))

  const docs: SearchDoc[] = entries
    .map((entry: { id: string; body?: string; data: Record<string, any> }) => {
      const chapterId = entry.id.split('/')[0]!
      const chapter = CHAPTER_BY_ID.get(chapterId)
      const source = entry.body ?? ''
      return {
        id: entry.id,
        href: `${import.meta.env.BASE_URL}ch/${entry.id}/`.replace(/\/{2,}/g, '/'),
        label: entry.data.section ?? chapter?.num ?? '',
        chapter: chapter ? `${chapter.num}. ${chapter.title}` : chapterId,
        title: entry.data.title,
        summary: entry.data.summary ?? '',
        headings: extractHeadings(source),
        body: mdxToPlainText(source),
        status: entry.data.status ?? 'stub',
      }
    })
    .sort((a: SearchDoc, b: SearchDoc) => a.id.localeCompare(b.id))

  return new Response(JSON.stringify([...labDocs, ...docs]), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}
