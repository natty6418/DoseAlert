import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Footer from '../components/Footer'; 


import { router } from 'expo-router';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

describe('Footer Component', () => {
  it('should navigate to Privacy Policy when the button is pressed', () => {
    const { getByText } = render(<Footer />);

    const privacyPolicyButton = getByText('Privacy Policy');
    fireEvent.press(privacyPolicyButton);

    expect(router.replace).toHaveBeenCalledWith('/settings/PrivacyPolicy');
  });
});