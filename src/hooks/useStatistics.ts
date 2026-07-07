import { useMemo } from 'react'
import type { SurgicalCase, Category } from '../types/case'

export interface Statistics {
  totalCases: number
  totalImages: number
  totalCategories: number
  casesByCategory: Record<string, number>
  imagesByCategory: Record<string, number>
}

export function useStatistics(cases: SurgicalCase[], categories: Category[]): Statistics {
  return useMemo(() => {
    const totalCases = cases.length
    const totalImages = cases.reduce((sum, c) => {
      return sum + Object.values(c.images).reduce((s, arr) => s + (arr?.length ?? 0), 0)
    }, 0)
    const totalCategories = categories.length

    const casesByCategory: Record<string, number> = {}
    const imagesByCategory: Record<string, number> = {}

    cases.forEach((c) => {
      casesByCategory[c.categoryId] = (casesByCategory[c.categoryId] ?? 0) + 1
      const imgs = Object.values(c.images).reduce((s, arr) => s + (arr?.length ?? 0), 0)
      imagesByCategory[c.categoryId] = (imagesByCategory[c.categoryId] ?? 0) + imgs
    })

    return {
      totalCases,
      totalImages,
      totalCategories,
      casesByCategory,
      imagesByCategory,
    }
  }, [cases, categories])
}
