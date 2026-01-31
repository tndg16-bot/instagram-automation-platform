import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AutoSettingsPage from '../app/auto/page';

// Mock fetch
global.fetch = vi.fn();

describe('AutoSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('accessToken', 'test-token');
    localStorage.setItem('instagramAccountId', 'test-account');
  });

  it('renders auto settings page with tabs', () => {
    render(<AutoSettingsPage />);
    
    expect(screen.getByText('自動化設定')).toBeInTheDocument();
    expect(screen.getByText('自動いいね')).toBeInTheDocument();
    expect(screen.getByText('自動フォロー')).toBeInTheDocument();
  });

  it('switches between like and follow tabs', () => {
    render(<AutoSettingsPage />);
    
    const followTab = screen.getByText('自動フォロー');
    fireEvent.click(followTab);
    
    expect(screen.getByText('自動フォローを有効にする')).toBeInTheDocument();
  });

  it('toggles auto-like activation', () => {
    render(<AutoSettingsPage />);
    
    const toggle = screen.getByRole('checkbox');
    expect(toggle).not.toBeChecked();
    
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('adds and removes hashtags', () => {
    render(<AutoSettingsPage />);
    
    const input = screen.getByPlaceholderText('ハッシュタグを追加');
    fireEvent.change(input, { target: { value: 'marketing' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    expect(screen.getByText('#marketing')).toBeInTheDocument();
    
    const removeButton = screen.getByText('×');
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('#marketing')).not.toBeInTheDocument();
  });

  it('saves settings on button click', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<AutoSettingsPage />);
    
    const saveButton = screen.getByText('設定を保存');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('設定を保存しました')).toBeInTheDocument();
    });
    
    expect(fetch).toHaveBeenCalledWith(
      '/api/auto/like/settings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    );
  });
});
