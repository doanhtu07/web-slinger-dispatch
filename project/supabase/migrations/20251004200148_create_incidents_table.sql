/*
  # Web-Slinger Dispatch Database Schema

  ## Overview
  Creates the database structure for the Spider-Man themed incident reporting system.
  
  ## New Tables
  
  ### `incidents`
  Stores all reported incidents from citizens across the multiverse
  - `id` (uuid, primary key) - Unique identifier for each incident
  - `user_id` (uuid, foreign key) - References the user who reported the incident
  - `incident_type` (text) - Type of incident (crime, accident, fire, medical, other)
  - `description` (text) - Detailed description of the incident
  - `latitude` (numeric) - Geographic latitude coordinate
  - `longitude` (numeric) - Geographic longitude coordinate
  - `location_name` (text) - Human-readable location name
  - `status` (text) - Current status (active, responding, resolved)
  - `reporter_name` (text) - Name of the person who reported
  - `created_at` (timestamptz) - When the incident was reported
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on the `incidents` table
  - Authenticated users can view all incidents (public safety information)
  - Only authenticated users can create new incident reports
  - Users can only update their own incident reports
  - Users can only delete their own incident reports
  
  ## Indexes
  - Index on `created_at` for efficient time-based queries
  - Index on `incident_type` for filtering by type
  - Index on `status` for filtering active incidents
*/

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_type text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  location_name text,
  status text NOT NULL DEFAULT 'active',
  reporter_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow authenticated users to view all incidents (public safety data)
CREATE POLICY "Anyone can view incidents"
  ON incidents
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create incidents
CREATE POLICY "Authenticated users can create incidents"
  ON incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own incidents
CREATE POLICY "Users can update own incidents"
  ON incidents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own incidents
CREATE POLICY "Users can delete own incidents"
  ON incidents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();