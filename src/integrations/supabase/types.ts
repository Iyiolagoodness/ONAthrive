export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          summary: string
          target_shipment_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          summary: string
          target_shipment_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          summary?: string
          target_shipment_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_target_shipment_id_fkey"
            columns: ["target_shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount_ngn: number
          created_at: string
          eta_days: number | null
          id: string
          message: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["bid_status"]
          transporter_id: string
          updated_at: string
        }
        Insert: {
          amount_ngn: number
          created_at?: string
          eta_days?: number | null
          id?: string
          message?: string | null
          shipment_id: string
          status?: Database["public"]["Enums"]["bid_status"]
          transporter_id: string
          updated_at?: string
        }
        Update: {
          amount_ngn?: number
          created_at?: string
          eta_days?: number | null
          id?: string
          message?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
          transporter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      escrows: {
        Row: {
          amount_ngn: number
          created_at: string
          customer_id: string
          id: string
          released_at: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["escrow_status"]
          transporter_id: string | null
          updated_at: string
        }
        Insert: {
          amount_ngn: number
          created_at?: string
          customer_id: string
          id?: string
          released_at?: string | null
          shipment_id: string
          status?: Database["public"]["Enums"]["escrow_status"]
          transporter_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_ngn?: number
          created_at?: string
          customer_id?: string
          id?: string
          released_at?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["escrow_status"]
          transporter_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrows_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          shipment_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          shipment_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verified?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          from_user_id: string
          id: string
          rating: number
          shipment_id: string
          to_user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          rating: number
          shipment_id: string
          to_user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          rating?: number
          shipment_id?: string
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          accepted_bid_id: string | null
          assigned_transporter_id: string | null
          budget_ngn: number | null
          created_at: string
          customer_id: string
          declared_value: number | null
          description: string | null
          dropoff_address: string | null
          dropoff_city: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          dropoff_state: string
          id: string
          package_type: Database["public"]["Enums"]["package_type"]
          pickup_address: string | null
          pickup_city: string | null
          pickup_date: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_state: string
          status: Database["public"]["Enums"]["shipment_status"]
          title: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          accepted_bid_id?: string | null
          assigned_transporter_id?: string | null
          budget_ngn?: number | null
          created_at?: string
          customer_id: string
          declared_value?: number | null
          description?: string | null
          dropoff_address?: string | null
          dropoff_city?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_state: string
          id?: string
          package_type?: Database["public"]["Enums"]["package_type"]
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_state: string
          status?: Database["public"]["Enums"]["shipment_status"]
          title: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          accepted_bid_id?: string | null
          assigned_transporter_id?: string | null
          budget_ngn?: number | null
          created_at?: string
          customer_id?: string
          declared_value?: number | null
          description?: string | null
          dropoff_address?: string | null
          dropoff_city?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_state?: string
          id?: string
          package_type?: Database["public"]["Enums"]["package_type"]
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_state?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          title?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          note: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          note?: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          note?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_ngn: number
          created_at: string
          id: string
          metadata: Json
          reference: string | null
          shipment_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount_ngn: number
          created_at?: string
          id?: string
          metadata?: Json
          reference?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount_ngn?: number
          created_at?: string
          id?: string
          metadata?: Json
          reference?: string | null
          shipment_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transporter_profiles: {
        Row: {
          available: boolean
          base_state: string | null
          bio: string | null
          business_name: string | null
          completed_jobs: number
          created_at: string
          id: string
          insured: boolean
          license_number: string | null
          plate_number: string | null
          rating: number
          rating_count: number
          service_states: string[]
          updated_at: string
          vehicle_types: string[]
        }
        Insert: {
          available?: boolean
          base_state?: string | null
          bio?: string | null
          business_name?: string | null
          completed_jobs?: number
          created_at?: string
          id: string
          insured?: boolean
          license_number?: string | null
          plate_number?: string | null
          rating?: number
          rating_count?: number
          service_states?: string[]
          updated_at?: string
          vehicle_types?: string[]
        }
        Update: {
          available?: boolean
          base_state?: string | null
          bio?: string | null
          business_name?: string | null
          completed_jobs?: number
          created_at?: string
          id?: string
          insured?: boolean
          license_number?: string | null
          plate_number?: string | null
          rating?: number
          rating_count?: number
          service_states?: string[]
          updated_at?: string
          vehicle_types?: string[]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_ngn: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_ngn?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_ngn?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_phone: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      bid_status: "pending" | "accepted" | "rejected" | "withdrawn"
      escrow_status: "held" | "released" | "refunded"
      kyc_status: "pending" | "submitted" | "approved" | "rejected"
      package_type:
        | "document"
        | "parcel_small"
        | "parcel_medium"
        | "parcel_large"
        | "pallet"
        | "fragile"
        | "perishable"
        | "vehicle"
        | "other"
      shipment_status:
        | "draft"
        | "open"
        | "bidding"
        | "assigned"
        | "in_transit"
        | "delivered"
        | "completed"
        | "cancelled"
        | "disputed"
      transaction_status: "pending" | "completed" | "failed" | "reversed"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "escrow_hold"
        | "escrow_release"
        | "payout"
        | "refund"
        | "fee"
      user_type: "customer" | "transporter" | "both"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      bid_status: ["pending", "accepted", "rejected", "withdrawn"],
      escrow_status: ["held", "released", "refunded"],
      kyc_status: ["pending", "submitted", "approved", "rejected"],
      package_type: [
        "document",
        "parcel_small",
        "parcel_medium",
        "parcel_large",
        "pallet",
        "fragile",
        "perishable",
        "vehicle",
        "other",
      ],
      shipment_status: [
        "draft",
        "open",
        "bidding",
        "assigned",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
        "disputed",
      ],
      transaction_status: ["pending", "completed", "failed", "reversed"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "escrow_hold",
        "escrow_release",
        "payout",
        "refund",
        "fee",
      ],
      user_type: ["customer", "transporter", "both"],
    },
  },
} as const
