-- Migration: Add description column to tasks table
-- Run this in Supabase SQL Editor

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT;
