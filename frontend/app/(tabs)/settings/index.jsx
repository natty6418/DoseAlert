import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  Info, 
  LogOut, 
  ChevronRight,
  UserPlus,
  FileText,
  RefreshCw
} from 'lucide-react-native';

import { useAuth } from '../../../contexts/AuthContext';
import { logoutUser } from '../../../services/UserHandler';
import SettingsCard from '../../../components/ui/SettingsCard';
import SettingsSection from '../../../components/ui/SettingsSection';
import UserProfileCard from '../../../components/ui/UserProfileCard';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const SettingsScreen = () => {
    const { isGuest, user, clearTokens } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleSignOut = async () => {
        try {
            await logoutUser();
            await clearTokens();
            setShowLogoutModal(false);
            router.replace('/(auth)/signIn');
        } catch (error) {
            console.error('Error during logout:', error);
            await clearTokens();
            setShowLogoutModal(false);
            router.replace('/(auth)/signIn');
        }
    };

    const handleGoToAuth = async () => {
        if (isGuest) {
            await clearTokens();
        }
        router.push('/(auth)/signIn');
    };

    const ChevronIcon = () => <ChevronRight size={20} color="#9CA3AF" />;

    return (
        <SafeAreaView className="bg-primary h-full">
            <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
            <View className="flex-1 px-4">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <ScreenHeader 
                        title="Settings"
                        subtitle="Manage your DoseAlert experience"
                    />

                    {/* User Profile Card */}
                    <UserProfileCard user={user} isGuest={isGuest} />

                    {/* Guest User Notice */}
                    {isGuest && (
                        <View className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                            <View className="flex-row items-start">
                                <UserPlus size={24} color="#3B82F6" className="mr-3 mt-1" />
                                <View className="flex-1">
                                    <Text className="text-blue-300 font-psemibold text-base mb-2">
                                        Create an Account
                                    </Text>
                                    <Text className="text-blue-200 text-sm mb-4">
                                        Sync your medications across devices, get cloud backup, and access premium features.
                                    </Text>
                                    <TouchableOpacity
                                        className="bg-blue-500 px-4 py-2 rounded-lg self-start"
                                        onPress={handleGoToAuth}
                                    >
                                        <Text className="text-white font-psemibold">Get Started</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Account Section */}
                    {!isGuest && (
                        <SettingsSection title="Account" description="Manage your personal information">
                            <SettingsCard
                                title="Account Information"
                                description="Edit your profile and contact details"
                                IconComponent={User}
                                onPress={() => router.push('/settings/AccountInfo')}
                                rightElement={<ChevronIcon />}
                            />
                        </SettingsSection>
                    )}

                    {/* App Settings Section */}
                    <SettingsSection title="App Settings" description="Customize your DoseAlert experience">
                        <SettingsCard
                            title="Notifications"
                            description="Manage reminders and alert preferences"
                            IconComponent={Bell}
                            onPress={() => router.push('/settings/Notifications')}
                            rightElement={<ChevronIcon />}
                        />
                        {!isGuest && (
                            <>
                                <SettingsCard
                                    title="Security & Privacy"
                                    description="Protect your account and data"
                                    IconComponent={Shield}
                                    onPress={() => router.push('/settings/Security')}
                                    rightElement={<ChevronIcon />}
                                />
                                <SettingsCard
                                    title="Data Sync"
                                    description="Manage cloud synchronization and backup"
                                    IconComponent={RefreshCw}
                                    onPress={() => router.push('/settings/Sync')}
                                    rightElement={<ChevronIcon />}
                                />
                            </>
                        )}
                    </SettingsSection>

                    {/* Support Section */}
                    <SettingsSection title="Support" description="Get help and learn more">
                        <SettingsCard
                            title="Help & Support"
                            description="FAQs, contact support, and user guides"
                            IconComponent={HelpCircle}
                            onPress={() => router.push('/settings/Help')}
                            rightElement={<ChevronIcon />}
                        />
                        <SettingsCard
                            title="Privacy Policy"
                            description="Read our privacy policy and terms"
                            IconComponent={FileText}
                            onPress={() => router.push('/settings/PrivacyPolicy')}
                            rightElement={<ChevronIcon />}
                        />
                        <SettingsCard
                            title="About DoseAlert"
                            description="App version, credits, and more"
                            IconComponent={Info}
                            onPress={() => router.push('/settings/About')}
                            rightElement={<ChevronIcon />}
                        />
                    </SettingsSection>

                    {/* Account Actions */}
                    {!isGuest ? (
                        <SettingsSection title="Account Actions">
                            <SettingsCard
                                title="Sign Out"
                                description="Sign out of your DoseAlert account"
                                IconComponent={LogOut}
                                onPress={() => setShowLogoutModal(true)}
                            />
                        </SettingsSection>
                    ) : (
                        <SettingsSection title="Account">
                            <SettingsCard
                                title="Sign In / Create Account"
                                description="Access your account or create a new one"
                                IconComponent={UserPlus}
                                onPress={handleGoToAuth}
                                highlight={true}
                                rightElement={<ChevronIcon />}
                            />
                        </SettingsSection>
                    )}

                    {/* Bottom spacing */}
                    <View className="h-8" />
                </ScrollView>
            </View>

            {/* Logout Confirmation Modal */}
            <Modal
                visible={showLogoutModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="w-4/5 bg-[#232533] rounded-2xl overflow-hidden">
                        {/* Modal Header */}
                        <View className="bg-red-500/10 border-b border-red-500/20 px-6 py-4">
                            <Text className="text-red-400 font-psemibold text-lg text-center">
                                Sign Out
                            </Text>
                        </View>
                        
                        {/* Modal Content */}
                        <View className="px-6 py-6">
                            <Text className="text-white font-pmedium text-center text-base mb-2">
                                Are you sure you want to sign out?
                            </Text>
                            <Text className="text-[#CDCDE0] text-sm text-center">
                                You&apos;ll need to sign in again to access your account and synced data.
                            </Text>
                        </View>
                        
                        {/* Modal Actions */}
                        <View className="flex-row border-t border-[#1E1B3A]">
                            <TouchableOpacity
                                className="flex-1 py-4 items-center justify-center border-r border-[#1E1B3A]"
                                onPress={() => setShowLogoutModal(false)}
                            >
                                <Text className="text-[#CDCDE0] font-pmedium">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 py-4 items-center justify-center"
                                onPress={handleSignOut}
                            >
                                <Text className="text-red-400 font-psemibold">Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default SettingsScreen;
