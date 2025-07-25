/*
  # Create chat messages table for enhanced chatbot

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `content` (text)
      - `role` (text) - 'user' or 'assistant'
      - `session_id` (text)
      - `emotion` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on chat_messages table
    - Add policies for public access (for chat functionality)
*/

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  session_id text NOT NULL,
  emotion text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public access for chat functionality
CREATE POLICY "Allow public insert on chat_messages"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on chat_messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role, created_at);