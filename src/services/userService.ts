
// Export users to CSV with status filter
export async function exportUsersToCSV(status: string = 'Active'): Promise<string> {
  try {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please log in again.');
    }
    
    // Get current user data
    const userData = localStorage.getItem('userData');
    if (!userData) {
      throw new Error('No user data found. Please log in again.');
    }
    
    const parsedData = JSON.parse(userData);
    const userPhone = parsedData.userPhone;
    
    const url = `${API_BASE}/users/export/csv?status=${encodeURIComponent(status)}&userPhone=${encodeURIComponent(userPhone)}`;
    
    const response = await fetchWithApiKey(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to export users: ${errorText}`);
    }
    
    return await response.text();
  } catch (error: any) {
    console.error('Failed to export users:', error);
    throw error;
  }
}
