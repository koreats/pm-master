export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          team_id: string
          title: string
          description: string | null
          status: 'active' | 'completed' | 'archived'
          progress: number
          start_date: string | null
          end_date: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          title: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          progress?: number
          start_date?: string | null
          end_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          title?: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          progress?: number
          start_date?: string | null
          end_date?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          goal_id: string
          title: string
          description: string | null
          status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          progress: number
          start_date: string | null
          end_date: string | null
          created_by: string
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          title: string
          description?: string | null
          status?: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          progress?: number
          start_date?: string | null
          end_date?: string | null
          created_by: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          title?: string
          description?: string | null
          status?: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          progress?: number
          start_date?: string | null
          end_date?: string | null
          created_by?: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string | null
          due_date: string | null
          estimated_hours: number | null
          actual_hours: number | null
          position: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          position?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          position?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          task_id: string | null
          project_id: string | null
          file_name: string
          file_url: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          project_id?: string | null
          file_name: string
          file_url: string
          file_size: number
          mime_type: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          project_id?: string | null
          file_name?: string
          file_url?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          team_id: string
          user_id: string
          entity_type: 'goal' | 'project' | 'task' | 'team' | 'system'
          entity_id: string
          action: string
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          entity_type: 'goal' | 'project' | 'task' | 'team' | 'system'
          entity_id: string
          action: string
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          entity_type?: 'goal' | 'project' | 'task' | 'team' | 'system'
          entity_id?: string
          action?: string
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      // Security tables added in migration 005
      auth_attempts: {
        Row: {
          id: string
          email: string
          ip_address: string
          user_agent: string | null
          success: boolean
          failure_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          ip_address: string
          user_agent?: string | null
          success?: boolean
          failure_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          ip_address?: string
          user_agent?: string | null
          success?: boolean
          failure_reason?: string | null
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          token_hash: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
          updated_at: string
          expires_at: string
          last_activity: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token_hash: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
          expires_at: string
          last_activity?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          token_hash?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string
          last_activity?: string | null
        }
      }
      rate_limits: {
        Row: {
          id: string
          identifier: string
          identifier_type: 'ip' | 'user' | 'api_key'
          action: string
          count: number
          window_start: string
          window_end: string
          created_at: string
        }
        Insert: {
          id?: string
          identifier: string
          identifier_type: 'ip' | 'user' | 'api_key'
          action: string
          count?: number
          window_start: string
          window_end: string
          created_at?: string
        }
        Update: {
          id?: string
          identifier?: string
          identifier_type?: 'ip' | 'user' | 'api_key'
          action?: string
          count?: number
          window_start?: string
          window_end?: string
          created_at?: string
        }
      }
      security_alerts: {
        Row: {
          id: string
          user_id: string | null
          alert_type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          title: string
          description: string
          metadata: Json | null
          status: 'active' | 'investigating' | 'resolved' | 'dismissed'
          created_at: string
          updated_at: string
          acknowledged: boolean
          acknowledged_by: string | null
          acknowledged_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          alert_type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          title: string
          description: string
          metadata?: Json | null
          status?: 'active' | 'investigating' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
          acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          alert_type?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          title?: string
          description?: string
          metadata?: Json | null
          status?: 'active' | 'investigating' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
          acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
        }
      }
      account_locks: {
        Row: {
          id: string
          email: string
          locked_at: string
          locked_until: string
          reason: string
          attempt_count: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          locked_at?: string
          locked_until: string
          reason: string
          attempt_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          locked_at?: string
          locked_until?: string
          reason?: string
          attempt_count?: number
          created_at?: string
        }
      }
      mfa_settings: {
        Row: {
          id: string
          user_id: string
          enabled: boolean
          method: 'totp' | 'sms' | 'email'
          secret_key: string | null
          backup_codes: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enabled?: boolean
          method: 'totp' | 'sms' | 'email'
          secret_key?: string | null
          backup_codes?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enabled?: boolean
          method?: 'totp' | 'sms' | 'email'
          secret_key?: string | null
          backup_codes?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      password_history: {
        Row: {
          id: string
          user_id: string
          password_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          password_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          password_hash?: string
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      documentation_events: {
        Row: {
          id: string
          type: string
          payload: string
          team_id: string
          source: string
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id: string
          type: string
          payload: string
          team_id: string
          source: string
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          payload?: string
          team_id?: string
          source?: string
          created_at?: string
          processed_at?: string | null
        }
      }
      documentation_cache: {
        Row: {
          id: string
          document_type: string
          content: string
          metadata: string
          last_updated: string
          version: string
          team_id: string
          file_hash: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          document_type: string
          content: string
          metadata: string
          last_updated?: string
          version: string
          team_id: string
          file_hash?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          document_type?: string
          content?: string
          metadata?: string
          last_updated?: string
          version?: string
          team_id?: string
          file_hash?: string | null
          expires_at?: string | null
        }
      }
      documentation_quality_metrics: {
        Row: {
          id: string
          team_id: string
          document_type: string
          file_path: string | null
          completeness_score: number
          accuracy_score: number
          freshness_score: number
          readability_score: number
          word_count: number | null
          code_examples_count: number | null
          broken_links_count: number | null
          outdated_references_count: number | null
          measured_at: string
          measurement_source: string
        }
        Insert: {
          id?: string
          team_id: string
          document_type: string
          file_path?: string | null
          completeness_score: number
          accuracy_score: number
          freshness_score: number
          readability_score: number
          word_count?: number | null
          code_examples_count?: number | null
          broken_links_count?: number | null
          outdated_references_count?: number | null
          measured_at?: string
          measurement_source: string
        }
        Update: {
          id?: string
          team_id?: string
          document_type?: string
          file_path?: string | null
          completeness_score?: number
          accuracy_score?: number
          freshness_score?: number
          readability_score?: number
          word_count?: number | null
          code_examples_count?: number | null
          broken_links_count?: number | null
          outdated_references_count?: number | null
          measured_at?: string
          measurement_source?: string
        }
      }
      documentation_generation_jobs: {
        Row: {
          id: string
          team_id: string
          job_type: 'progress_report' | 'api_documentation' | 'component_documentation' | 'schema_documentation' | 'full_regeneration'
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          config: Json
          priority: number
          progress_percentage: number
          current_step: string | null
          total_steps: number
          result_content: string | null
          result_metadata: Json | null
          error_message: string | null
          error_details: Json | null
          created_at: string
          started_at: string | null
          completed_at: string | null
          processing_time_ms: number | null
          memory_usage_mb: number | null
          retry_count: number
          max_retries: number
          retry_after: string | null
        }
        Insert: {
          id?: string
          team_id: string
          job_type: 'progress_report' | 'api_documentation' | 'component_documentation' | 'schema_documentation' | 'full_regeneration'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          config?: Json
          priority?: number
          progress_percentage?: number
          current_step?: string | null
          total_steps?: number
          result_content?: string | null
          result_metadata?: Json | null
          error_message?: string | null
          error_details?: Json | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          processing_time_ms?: number | null
          memory_usage_mb?: number | null
          retry_count?: number
          max_retries?: number
          retry_after?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          job_type?: 'progress_report' | 'api_documentation' | 'component_documentation' | 'schema_documentation' | 'full_regeneration'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          config?: Json
          priority?: number
          progress_percentage?: number
          current_step?: string | null
          total_steps?: number
          result_content?: string | null
          result_metadata?: Json | null
          error_message?: string | null
          error_details?: Json | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          processing_time_ms?: number | null
          memory_usage_mb?: number | null
          retry_count?: number
          max_retries?: number
          retry_after?: string | null
        }
      }
      documentation_settings: {
        Row: {
          id: string
          team_id: string
          auto_generation_enabled: boolean
          sync_interval_minutes: number
          max_cache_versions: number
          language_preference: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          auto_generation_enabled?: boolean
          sync_interval_minutes?: number
          max_cache_versions?: number
          language_preference?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          auto_generation_enabled?: boolean
          sync_interval_minutes?: number
          max_cache_versions?: number
          language_preference?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // Auth functions from migration 006
      require_mfa_level: {
        Args: { required_level?: string }
        Returns: boolean
      }
      user_team_ids: {
        Args: {}
        Returns: string[]
      }
      is_team_admin: {
        Args: { check_team_id: string }
        Returns: boolean
      }
      is_business_hours: {
        Args: {}
        Returns: boolean
      }
      is_allowed_ip: {
        Args: {}
        Returns: boolean
      }
      mask_sensitive_data: {
        Args: { data_value: string; mask_type?: string }
        Returns: string
      }
      // Security functions from migration 009
      validate_password_policy: {
        Args: { password_text: string }
        Returns: { is_valid: boolean; policy_check: string; requirement: string }[]
      }
      check_account_lockout_policy: {
        Args: { user_email: string }
        Returns: { should_lock: boolean; failed_attempts: number; lockout_until: string | null; policy_compliant: boolean }[]
      }
      mask_personal_data: {
        Args: { data_value: string; data_type: string; requester_role?: string }
        Returns: string
      }
      detect_suspicious_activity: {
        Args: {}
        Returns: {
          alert_type: string
          severity: string
          user_id: string | null
          description: string
          metadata: Json
          detected_at: string
        }[]
      }
      create_security_alerts: {
        Args: {}
        Returns: void
      }
      validate_log_retention_policy: {
        Args: {}
        Returns: {
          log_table: string
          oldest_record: string
          retention_days: number
          compliant: boolean
          recommendation: string
        }[]
      }
      comprehensive_security_audit: {
        Args: {}
        Returns: {
          category: string
          check_name: string
          status: string
          details: string
          priority: string
        }[]
      }
      daily_security_maintenance: {
        Args: {}
        Returns: string
      }
      // Data integrity functions from migration 007
      validate_date_range: {
        Args: { start_date: string | null; end_date: string | null; allow_same_day?: boolean }
        Returns: boolean
      }
      validate_progress_status: {
        Args: { progress: number; status: string }
        Returns: boolean
      }
      full_consistency_check: {
        Args: {}
        Returns: {
          check_name: string
          table_name: string
          inconsistency_count: number
          details: string
        }[]
      }
      daily_consistency_check: {
        Args: {}
        Returns: string
      }
      // Performance functions from migration 008
      analyze_index_usage: {
        Args: {}
        Returns: {
          schema_name: string
          table_name: string
          index_name: string
          index_size: string
          scans: number
          tuples_read: number
          tuples_fetched: number
          efficiency_ratio: number
        }[]
      }
      find_unused_indexes: {
        Args: {}
        Returns: {
          schema_name: string
          table_name: string
          index_name: string
          index_size: string
          last_scan: string
        }[]
      }
      analyze_slow_queries: {
        Args: { min_calls?: number; min_avg_time_ms?: number }
        Returns: {
          query_text: string
          calls: number
          total_time_ms: number
          avg_time_ms: number
          rows_affected: number
        }[]
      }
    }
    Enums: {
      priority_level: 'low' | 'medium' | 'high' | 'urgent'
    }
    CompositeTypes: {
      [_ in never]: never
    }
    Schemas: {
      auth: {
        Tables: {}
        Views: {}
        Functions: {
          require_mfa_level: {
            Args: { required_level?: string }
            Returns: boolean
          }
          user_team_ids: {
            Args: {}
            Returns: string[]
          }
          is_team_admin: {
            Args: { check_team_id: string }
            Returns: boolean
          }
          is_business_hours: {
            Args: {}
            Returns: boolean
          }
          is_allowed_ip: {
            Args: {}
            Returns: boolean
          }
        }
      }
      security: {
        Tables: {}
        Views: {}
        Functions: {
          validate_password_policy: {
            Args: { password_text: string }
            Returns: { is_valid: boolean; policy_check: string; requirement: string }[]
          }
          check_account_lockout_policy: {
            Args: { user_email: string }
            Returns: { should_lock: boolean; failed_attempts: number; lockout_until: string | null; policy_compliant: boolean }[]
          }
          mask_personal_data: {
            Args: { data_value: string; data_type: string; requester_role?: string }
            Returns: string
          }
          detect_suspicious_activity: {
            Args: {}
            Returns: { alert_type: string; severity: string; user_id: string | null; description: string; metadata: Json; detected_at: string }[]
          }
          create_security_alerts: {
            Args: {}
            Returns: void
          }
          validate_log_retention_policy: {
            Args: {}
            Returns: { log_table: string; oldest_record: string; retention_days: number; compliant: boolean; recommendation: string }[]
          }
          comprehensive_security_audit: {
            Args: {}
            Returns: { category: string; check_name: string; status: string; details: string; priority: string }[]
          }
          daily_security_maintenance: {
            Args: {}
            Returns: string
          }
          verify_rls_enabled: {
            Args: {}
            Returns: { schema_name: string; table_name: string; rls_enabled: boolean; policy_count: number }[]
          }
          security_audit: {
            Args: {}
            Returns: { check_name: string; status: string; details: string }[]
          }
        }
      }
      data_integrity: {
        Tables: {}
        Views: {}
        Functions: {
          full_consistency_check: {
            Args: {}
            Returns: { check_name: string; table_name: string; inconsistency_count: number; details: string }[]
          }
          daily_consistency_check: {
            Args: {}
            Returns: string
          }
        }
      }
      performance: {
        Tables: {}
        Views: {}
        Functions: {
          analyze_index_usage: {
            Args: {}
            Returns: { schema_name: string; table_name: string; index_name: string; index_size: string; scans: number; tuples_read: number; tuples_fetched: number; efficiency_ratio: number }[]
          }
          find_unused_indexes: {
            Args: {}
            Returns: { schema_name: string; table_name: string; index_name: string; index_size: string; last_scan: string }[]
          }
          analyze_slow_queries: {
            Args: { min_calls?: number; min_avg_time_ms?: number }
            Returns: { query_text: string; calls: number; total_time_ms: number; avg_time_ms: number; rows_affected: number }[]
          }
        }
      }
    }
  }
}