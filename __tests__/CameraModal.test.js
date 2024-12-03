import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CameraModal from '../components/CameraModal'; // Adjust the import to your file structure
import { useCameraPermissions } from 'expo-camera';


jest.mock('expo-camera', () => ({
  useCameraPermissions: jest.fn(),
  // Mock CameraView as a simple functional component
  CameraView: jest.fn(() => {
    return <div testID="camera-view">Mock Camera</div>;
  })
}));


describe('CameraModal', () => {
  beforeEach(() => {
    // Reset mock before each test
    jest.clearAllMocks();
  });

  it('renders correctly when isVisible is true', () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    const { getByTestId } = render(
      <CameraModal isVisible={true} onClose={jest.fn()} onScan={jest.fn()} />
    );

    expect(getByTestId('camera-modal')).toBeTruthy();
  });

  it('does not render when isVisible is false', () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    const { queryByTestId } = render(
      <CameraModal isVisible={false} onClose={jest.fn()} onScan={jest.fn()} />
    );

    expect(queryByTestId('camera-modal')).toBeNull();
  });

  it('renders permission request message when permission is not granted', () => {
    useCameraPermissions.mockReturnValue([{ granted: false }, jest.fn()]);
    const { getByText } = render(
      <CameraModal isVisible={true} onClose={jest.fn()} onScan={jest.fn()} />
    );

    expect(getByText('We need your permission to show the camera')).toBeTruthy();
    expect(getByText('Grant permission')).toBeTruthy();
  });

  it('calls requestPermission when the Grant Permission button is pressed', () => {
    const requestPermissionMock = jest.fn();
    useCameraPermissions.mockReturnValue([{ granted: false }, requestPermissionMock]);

    const { getByText } = render(
      <CameraModal isVisible={true} onClose={jest.fn()} onScan={jest.fn()} />
    );

    const button = getByText('Grant permission');
    fireEvent.press(button);

    expect(requestPermissionMock).toHaveBeenCalled();
  });

  it('calls onClose when the close button is pressed', () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    const onCloseMock = jest.fn();

    const { getByTestId } = render(
      <CameraModal isVisible={true} onClose={onCloseMock} onScan={jest.fn()} />
    );

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(onCloseMock).toHaveBeenCalled();
  });
  it('renders correctly when permission is denied and user reopens the camera', async () => {
    const requestPermissionMock = jest.fn().mockResolvedValue({ granted: false });
    useCameraPermissions.mockReturnValue([{ granted: false }, requestPermissionMock]);
  
    const { getByText, rerender } = render(
      <CameraModal isVisible={true} onClose={jest.fn()} onScan={jest.fn()} />
    );
  
    expect(getByText('We need your permission to show the camera')).toBeTruthy();
  
    rerender(<CameraModal isVisible={true} onClose={jest.fn()} onScan={jest.fn()} />);
    expect(requestPermissionMock).toHaveBeenCalled();
  });
  it('calls onScan each time a barcode is scanned', () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    const onScanMock = jest.fn();
  
    const { getByTestId } = render(
      <CameraModal isVisible={true} onClose={jest.fn()} onScan={onScanMock} />
    );
  
    const cameraView = getByTestId('camera-view');
  
    fireEvent(cameraView, 'onBarcodeScanned', { data: '1234567890' });
    fireEvent(cameraView, 'onBarcodeScanned', { data: '0987654321' });
  
    expect(onScanMock).toHaveBeenCalledTimes(2);
    expect(onScanMock).toHaveBeenCalledWith({ data: '1234567890' });
    expect(onScanMock).toHaveBeenCalledWith({ data: '0987654321' });
  });
  it('closes the modal when onClose is triggered', () => {
    useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
    const onCloseMock = jest.fn();
  
    const { getByTestId } = render(
      <CameraModal isVisible={true} onClose={onCloseMock} onScan={jest.fn()} />
    );
  
    fireEvent.press(getByTestId('close-button'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
  
  
  
  

//   it('calls onScan when a barcode is scanned', () => {
//     useCameraPermissions.mockReturnValue([{ granted: true }, jest.fn()]);
//     const onScanMock = jest.fn();

//     const { getByTestId } = render(
//       <CameraModal isVisible={true} onClose={jest.fn()} onScan={onScanMock} />
//     );

//     const cameraView = getByTestId('camera-view');
//     fireEvent(cameraView, 'onBarcodeScanned', { data: '1234567890' });

//     expect(onScanMock).toHaveBeenCalledWith({ data: '1234567890' });
//   });
});
