import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFirebaseContext } from '../../../contexts/FirebaseContext';
import { auth, db } from '../../../services/firebaseConfig';
import { doc, getDoc, updateDoc} from 'firebase/firestore';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const AccountInfo = () => {
  const { user } = useFirebaseContext(); // Assume this gets the logged-in user's info
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user information on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userDoc = doc(db, 'users', auth.currentUser.uid); // Assuming "users" is the collection
        const snapshot = await getDoc(userDoc);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserInfo({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: auth.currentUser.email,
          });
        } else {
          Alert.alert('Error', 'No account data found.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load account information.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // Handle Save Changes
  const handleSaveChanges = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password to save changes.');
      return;
    }

    try {
      setIsSaving(true);

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update Firestore with new values
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDoc, {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
      });

      Alert.alert('Success', 'Your account information has been updated.');
      setCurrentPassword(''); // Clear the password field
    } catch (error) {
      console.error('Error saving changes:', error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'The current password you entered is incorrect.');
      } else {
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#161622]">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#161622] p-4">
      <Text className="text-white text-2xl font-semibold mb-4">Account Info</Text>

      <View className="bg-[#232533] p-4 rounded-lg">
        <Text className="text-white mb-2">First Name</Text>
        <TextInput
          value={userInfo.firstName}
          onChangeText={(text) => setUserInfo({ ...userInfo, firstName: text })}
          className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4"
        />

        <Text className="text-white mb-2">Last Name</Text>
        <TextInput
          value={userInfo.lastName}
          onChangeText={(text) => setUserInfo({ ...userInfo, lastName: text })}
          className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4"
        />

        <Text className="text-white mb-2">Email</Text>
        <TextInput
          value={userInfo.email}
          editable={false} // Email is non-editable
          className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4"
        />

        <Text className="text-white mb-2">Current Password</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={true} // Mask the password
          className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4"
        />

        <TouchableOpacity
          onPress={handleSaveChanges}
          disabled={isSaving} // Disable button while saving
          className={`p-4 rounded-lg mt-4 items-center ${isSaving ? 'bg-gray-500' : 'bg-[#4CAF50]'}`}
        >
          <Text className="text-white font-semibold">{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AccountInfo;