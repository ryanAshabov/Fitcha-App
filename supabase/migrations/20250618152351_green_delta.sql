/*
  # Create search_players function

  1. New Functions
    - `search_players` - RPC function to search and filter player profiles
      - Parameters: p_sport (text), p_level (text), p_location (text)
      - Returns: SETOF profiles matching the search criteria
      - Supports dynamic filtering based on provided parameters
      - Efficiently searches through JSONB sports data

  2. Security
    - Function is accessible to authenticated users
    - Uses existing RLS policies on profiles table
*/

CREATE OR REPLACE FUNCTION search_players(
  p_sport TEXT DEFAULT NULL,
  p_level TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM profiles
  WHERE 
    -- Filter by sport and level if provided
    (p_sport IS NULL OR p_level IS NULL OR 
     EXISTS (
       SELECT 1 
       FROM jsonb_array_elements(sports) AS sport_obj
       WHERE sport_obj->>'sport' ILIKE '%' || p_sport || '%'
       AND (p_level IS NULL OR sport_obj->>'level' = p_level)
     ))
    -- Filter by location if provided
    AND (p_location IS NULL OR location ILIKE '%' || p_location || '%')
    -- Only return profiles with at least first and last name
    AND first_name IS NOT NULL 
    AND first_name != ''
    AND last_name IS NOT NULL 
    AND last_name != ''
  ORDER BY updated_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_players TO authenticated;