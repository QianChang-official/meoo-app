/**
 * 🚨 此文件由 CloudEnableTool 自动生成，请勿手动修改！
 * 注意：因 meoo db migrate 存在 CLI bug，memories 表类型由月沐手动同步。
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      memories: {
        Row: {
          id: number
          user_id: string
          title: string
          content: string
          tags: string[] | null
          importance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id?: string
          title?: string
          content?: string
          tags?: string[] | null
          importance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          content?: string
          tags?: string[] | null
          importance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
