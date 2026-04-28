import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Alert,
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function App() {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [savedImageUri, setSavedImageUri] = useState<string | null>(null);

  const takePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (!photo?.uri) {
        return;
      }

      setSelectedImageUri(photo.uri);
      setSavedImageUri(null);
    } catch (error) {
      Alert.alert('Capture failed', 'Cannot take photo from camera.');
    }
  };

  const pickFromGallery = async () => {
    const pickerPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!pickerPermission.granted) {
      Alert.alert('Permission required', 'Please allow gallery access first.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    setSelectedImageUri(result.assets[0].uri);
    setSavedImageUri(null);
  };

  const saveImage = async () => {
    if (!selectedImageUri) {
      return;
    }

    if (!mediaPermission?.granted) {
      const requested = await requestMediaPermission();
      if (!requested.granted) {
        Alert.alert('Permission required', 'Please allow media library access first.');
        return;
      }
    }

    if (!FileSystem.documentDirectory) {
      Alert.alert('Save failed', 'File system directory is unavailable.');
      return;
    }

    const filename = `saved-image-${Date.now()}.jpg`;
    const targetUri = `${FileSystem.documentDirectory}${filename}`;

    try {
      await FileSystem.copyAsync({
        from: selectedImageUri,
        to: targetUri,
      });
      await MediaLibrary.saveToLibraryAsync(targetUri);
      setSavedImageUri(targetUri);
      Alert.alert('Success', 'Image was saved and added to your gallery.');
    } catch (error) {
      Alert.alert('Save failed', 'Could not save image to filesystem/gallery.');
    }
  };

  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerContent}>
          <Text>Checking camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerContent}>
          <Text style={styles.permissionText}>Camera permission is required.</Text>
          <Button title="Allow Camera" onPress={requestCameraPermission} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Week 9 - Camera, Storage, Filesystem</Text>

        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={cameraFacing} />
        </View>

        <View style={styles.row}>
          <Button title="CAPTURE PHOTO" onPress={takePhoto} />
          <Button
            title={cameraFacing === 'back' ? 'FRONT CAMERA' : 'BACK CAMERA'}
            onPress={() =>
              setCameraFacing((current) => (current === 'back' ? 'front' : 'back'))
            }
          />
        </View>

        <View style={styles.row}>
          <Button title="PICK FROM GALLERY" onPress={pickFromGallery} />
          <Button
            title="SAVE IMAGE"
            onPress={saveImage}
            disabled={!selectedImageUri}
            color="#1f7a1f"
          />
        </View>

        {selectedImageUri ? (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Selected Image Preview</Text>
            <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
          </View>
        ) : null}

        {savedImageUri ? (
          <Text style={styles.savedText}>Saved to filesystem: {savedImageUri}</Text>
        ) : null}
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    padding: 16,
    gap: 12,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  permissionText: {
    marginBottom: 12,
    fontSize: 16,
  },
  cameraContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  previewSection: {
    marginTop: 4,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
  },
  savedText: {
    marginTop: 8,
    fontSize: 12,
    color: '#2b5d2b',
  },
});
