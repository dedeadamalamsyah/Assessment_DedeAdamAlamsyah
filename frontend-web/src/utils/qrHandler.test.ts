import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateQR, saveToHistory } from './qrHandler';

describe('qrHandler - validateQR', () => {
  it('harus mengembalikan isValid false jika kode kosong', () => {
    const result = validateQR('');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Kode tidak terdeteksi');
  });

  it('harus mengembalikan isValid false jika tidak berakhiran /HLTC', () => {
    const result = validateQR('CODE-RANDOM-123');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Invalid. Format harus [CODE]/HLTC.');
  });

  it('harus mengembalikan isValid false jika kode terlalu pendek', () => {
    const result = validateQR('/HLTC');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Kode terlalu pendek');
  });

  it('harus mengembalikan isValid true jika formatnya benar', () => {
    const result = validateQR('HALOTEC123/HLTC');
    expect(result.isValid).toBe(true);
    expect(result.message).toBe('Valid');
  });
});

describe('qrHandler - saveToHistory', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockStorage[key] = value.toString();
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    });
  });

  it('harus bisa menyimpan data scan baru ke localStorage', () => {
    const mockScanResult = { code: 'TEST/HLTC', isValid: true };

    const history = saveToHistory(mockScanResult);

    expect(history.length).toBe(1);
    expect(history[0].code).toBe('TEST/HLTC');
    expect(history[0].isValid).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});