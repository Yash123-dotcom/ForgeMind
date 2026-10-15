-- ForgeMind Supabase Schema & Row-Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Investigations Table
CREATE TABLE IF NOT EXISTS public.investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    error_message TEXT NOT NULL,
    code_snippet TEXT,
    project_context TEXT,
    unity_version TEXT NOT NULL,
    render_pipeline TEXT NOT NULL,
    target_platform TEXT,
    attached_files JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Diagnostic Reports Table
CREATE TABLE IF NOT EXISTS public.diagnostic_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    executive_summary TEXT NOT NULL,
    likely_root_cause TEXT NOT NULL,
    severity TEXT NOT NULL,
    confidence JSONB NOT NULL,
    rule_based_findings JSONB DEFAULT '[]'::jsonb,
    evidence JSONB DEFAULT '[]'::jsonb,
    recommended_fix JSONB DEFAULT '[]'::jsonb,
    suggested_code_changes JSONB DEFAULT '[]'::jsonb,
    verification_steps JSONB DEFAULT '[]'::jsonb,
    alternative_causes JSONB DEFAULT '[]'::jsonb,
    missing_information JSONB DEFAULT '[]'::jsonb,
    analysis_mode TEXT NOT NULL,
    provider_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Feedback Table
CREATE TABLE IF NOT EXISTS public.investigation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    helpful BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow users to only access their own investigations
CREATE POLICY "Users can view own investigations" ON public.investigations
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own investigations" ON public.investigations
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own investigations" ON public.investigations
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own investigations" ON public.investigations
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Reports inherit access through parent investigation
CREATE POLICY "Users can view own reports" ON public.diagnostic_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.investigations
            WHERE public.investigations.id = diagnostic_reports.investigation_id
            AND (public.investigations.user_id = auth.uid() OR public.investigations.user_id IS NULL)
        )
    );

CREATE POLICY "Users can insert reports for own investigations" ON public.diagnostic_reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.investigations
            WHERE public.investigations.id = diagnostic_reports.investigation_id
            AND (public.investigations.user_id = auth.uid() OR public.investigations.user_id IS NULL)
        )
    );

