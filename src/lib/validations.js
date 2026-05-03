import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
  role: z.enum(['etudiant', 'professeur']),
})

export const courseSchema = z.object({
  title: z.string().min(3, 'Titre requis (min 3 caractères)'),
  description: z.string().optional(),
})

export const assignmentSchema = z.object({
  title: z.string().min(3, 'Titre requis'),
  description: z.string().optional(),
  due_date: z.string().optional(),
})

export const gradeSchema = z.object({
  grade: z.coerce.number().min(0, 'Min 0').max(20, 'Max 20'),
  feedback: z.string().optional(),
})
