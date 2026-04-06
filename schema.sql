-- ============================================================
-- Hydra Story Maker - Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROJECTS
-- ============================================================
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CHARACTERS (Personas per project)
-- ============================================================
create table if not exists characters (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  role text,
  background text,
  motivation text,
  traits text[],
  avatar_color text default '#6c8ebf',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SCENES (Nodes on canvas)
-- ============================================================
create table if not exists scenes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  title text not null default 'Untitled Scene',
  description text,
  character_ids uuid[],
  position_x float default 0,
  position_y float default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CONNECTIONS (Edges between scenes)
-- ============================================================
create table if not exists connections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  source_scene_id uuid references scenes(id) on delete cascade not null,
  target_scene_id uuid references scenes(id) on delete cascade not null,
  label text,
  created_at timestamptz default now()
);

-- ============================================================
-- CONFLICTS (AI-generated conflict nodes)
-- ============================================================
create table if not exists conflicts (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  connection_id uuid references connections(id) on delete cascade not null,
  selected_option int default null,
  options jsonb not null default '[]',
  position_x float default 0,
  position_y float default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger trg_characters_updated_at
  before update on characters
  for each row execute function update_updated_at();

create trigger trg_scenes_updated_at
  before update on scenes
  for each row execute function update_updated_at();

create trigger trg_conflicts_updated_at
  before update on conflicts
  for each row execute function update_updated_at();

-- ============================================================
-- RLS (Row Level Security) - public access for now (no auth)
-- ============================================================
alter table projects enable row level security;
alter table characters enable row level security;
alter table scenes enable row level security;
alter table connections enable row level security;
alter table conflicts enable row level security;

create policy "Allow all on projects" on projects for all using (true) with check (true);
create policy "Allow all on characters" on characters for all using (true) with check (true);
create policy "Allow all on scenes" on scenes for all using (true) with check (true);
create policy "Allow all on connections" on connections for all using (true) with check (true);
create policy "Allow all on conflicts" on conflicts for all using (true) with check (true);
