import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
	RefreshCw, 
	Cloud, 
	Download, 
	Upload, 
	Database,
	Clock,
	AlertCircle,
	CheckCircle,
	XCircle,
	Trash2
} from 'lucide-react-native';

import { useAuth } from '../../../contexts/AuthContext';
import { 
	fullSync, 
	incrementalSync, 
	getLastSyncTime, 
	isSyncNeeded,
	cleanupDeletedRecords 
} from '../../../services/sync';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const SyncSettings = () => {
	const { user, isGuest } = useAuth();
	const [syncing, setSyncing] = useState(false);
	const [lastSyncTime, setLastSyncTime] = useState(null);
	const [syncNeeded, setSyncNeeded] = useState(false);
	const [syncResults, setSyncResults] = useState(null);
	const [cleaningUp, setCleaningUp] = useState(false);

	useEffect(() => {
		loadSyncStatus();
	}, []);

	const loadSyncStatus = async () => {
		try {
			const lastSync = await getLastSyncTime();
			const needsSync = await isSyncNeeded(1); // Check if sync needed (1 hour threshold)
			
			setLastSyncTime(lastSync);
			setSyncNeeded(needsSync);
		} catch (error) {
			console.error('Error loading sync status:', error);
		}
	};

	const handleFullSync = async () => {
		if (syncing || isGuest || !user?.id) return;
		
		setSyncing(true);
		setSyncResults(null);
		
		try {
			console.log('Starting full sync for user:', user.id);
			const result = await fullSync(user.id);
			
			setSyncResults(result);
			await loadSyncStatus(); // Refresh status
			
			// Show success message
			Alert.alert(
				'Sync Completed',
				'Your data has been successfully synced with the cloud.',
				[{ text: 'OK' }]
			);
			
			console.log('Full sync completed!', result);
		} catch (error) {
			console.error('Full sync failed:', error);
			Alert.alert(
				'Sync Failed',
				`Failed to sync data: ${error.message}`,
				[{ text: 'OK' }]
			);
		} finally {
			setSyncing(false);
		}
	};

	const handleIncrementalSync = async () => {
		if (syncing || isGuest || !user?.id) return;
		
		setSyncing(true);
		setSyncResults(null);
		
		try {
			console.log('Starting incremental sync for user:', user.id);
			const result = await incrementalSync(user.id);
			
			setSyncResults(result);
			await loadSyncStatus();
			
			Alert.alert(
				'Quick Sync Completed',
				'Your latest changes have been synced.',
				[{ text: 'OK' }]
			);
			
			console.log('Incremental sync completed!', result);
		} catch (error) {
			console.error('Incremental sync failed:' );
			Alert.alert(
				'Sync Failed',
				`Failed to sync changes: ${error.message}`,
				[{ text: 'OK' }]
			);
		} finally {
			setSyncing(false);
		}
	};

	const handleCleanup = async () => {
		if (cleaningUp || isGuest || !user?.id) return;
		
		Alert.alert(
			'Clean Up Deleted Data',
			'This will permanently remove deleted items that have been synced. This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ 
					text: 'Clean Up', 
					style: 'destructive',
					onPress: performCleanup
				}
			]
		);
	};

	const performCleanup = async () => {
		setCleaningUp(true);
		
		try {
			const result = await cleanupDeletedRecords(user.id);
			
			Alert.alert(
				'Cleanup Completed',
				`Permanently removed ${result.cleanedCount} deleted items.`,
				[{ text: 'OK' }]
			);
			
			console.log('Cleanup completed:', result);
		} catch (error) {
			console.error('Cleanup failed:', error);
			Alert.alert(
				'Cleanup Failed',
				`Failed to clean up data: ${error.message}`,
				[{ text: 'OK' }]
			);
		} finally {
			setCleaningUp(false);
		}
	};

	const formatSyncTime = (timestamp) => {
		if (!timestamp) return 'Never';
		
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
		return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
	};

	const renderSyncResults = () => {
		if (!syncResults) return null;

		const totalSynced = Object.values(syncResults).reduce((sum, result) => sum + (result.synced || 0), 0);
		const totalFailed = Object.values(syncResults).reduce((sum, result) => sum + (result.failed || 0), 0);

		return (
			<View className="bg-[#1E1B3A] rounded-xl p-4 mb-6">
				<Text className="text-white font-psemibold text-lg mb-3">Last Sync Results</Text>
				
				<View className="flex-row items-center mb-2">
					<CheckCircle size={16} color="#10B981" />
					<Text className="text-green-400 ml-2 font-pmedium">
						{totalSynced} items synced successfully
					</Text>
				</View>
				
				{totalFailed > 0 && (
					<View className="flex-row items-center mb-2">
						<XCircle size={16} color="#EF4444" />
						<Text className="text-red-400 ml-2 font-pmedium">
							{totalFailed} items failed to sync
						</Text>
					</View>
				)}
				
				<View className="mt-3 pt-3 border-t border-gray-600">
					{Object.entries(syncResults).map(([key, result]) => (
						<View key={key} className="flex-row justify-between items-center mb-1">
							<Text className="text-gray-300 text-sm capitalize">
								{key.replace('_', ' ')}
							</Text>
							<Text className="text-gray-300 text-sm">
								{result.synced || 0}/{(result.synced || 0) + (result.failed || 0)}
							</Text>
						</View>
					))}
				</View>
			</View>
		);
	};

	if (isGuest) {
		return (
			<SafeAreaView className="bg-primary h-full">
				<View className="flex-1 px-4">
					<ScreenHeader 
						title="Data Sync"
						onBack={() => router.back()}
						showBackButton={true}
					/>
					
					<View className="flex-1 justify-center items-center px-6">
						<Cloud size={64} color="#6B7280" />
						<Text className="text-white font-psemibold text-xl text-center mt-4 mb-2">
							Sync Unavailable
						</Text>
						<Text className="text-gray-400 text-center">
							Create an account or sign in to sync your medications across devices and backup your data to the cloud.
						</Text>
						
						<TouchableOpacity
							className="bg-secondary-200 px-6 py-3 rounded-lg mt-6"
							onPress={() => router.push('/(auth)/signIn')}
						>
							<Text className="text-white font-psemibold">Sign In / Create Account</Text>
						</TouchableOpacity>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="bg-primary h-full">
			<View className="flex-1 px-4">
				<ScreenHeader 
					title="Data Sync"
					subtitle="Manage cloud synchronization"
					onBack={() => router.back()}
					showBackButton={true}
				/>

				<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
					{/* Sync Status */}
					<View className="bg-[#1E1B3A] rounded-xl p-4 mb-6">
						<View className="flex-row items-center justify-between mb-3">
							<Text className="text-white font-psemibold text-lg">Sync Status</Text>
							{syncNeeded ? (
								<View className="flex-row items-center">
									<AlertCircle size={16} color="#F59E0B" />
									<Text className="text-yellow-500 ml-1 text-sm">Sync Needed</Text>
								</View>
							) : (
								<View className="flex-row items-center">
									<CheckCircle size={16} color="#10B981" />
									<Text className="text-green-400 ml-1 text-sm">Up to Date</Text>
								</View>
							)}
						</View>
						
						<View className="flex-row items-center">
							<Clock size={16} color="#9CA3AF" />
							<Text className="text-gray-300 ml-2">
								Last synced: {formatSyncTime(lastSyncTime)}
							</Text>
						</View>
					</View>

					{/* Sync Results */}
					{renderSyncResults()}

					{/* Sync Actions */}
					<View className="bg-[#1E1B3A] rounded-xl p-4 mb-6">
						<Text className="text-white font-psemibold text-lg mb-4">Sync Actions</Text>
						
						{/* Full Sync */}
						<TouchableOpacity
							className={`bg-secondary-200 rounded-lg p-4 mb-3 ${syncing ? 'opacity-50' : ''}`}
							onPress={handleFullSync}
							disabled={syncing}
						>
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center flex-1">
									<Cloud size={20} color="#FFFFFF" />
									<View className="ml-3 flex-1">
										<Text className="text-white font-psemibold">Full Sync</Text>
										<Text className="text-gray-300 text-sm">
											Complete two-way sync with cloud
										</Text>
									</View>
								</View>
								{syncing ? (
									<ActivityIndicator size="small" color="#FFFFFF" />
								) : (
									<RefreshCw size={20} color="#FFFFFF" />
								)}
							</View>
						</TouchableOpacity>

						{/* Quick Sync */}
						<TouchableOpacity
							className={`bg-blue-600 rounded-lg p-4 mb-3 ${syncing ? 'opacity-50' : ''}`}
							onPress={handleIncrementalSync}
							disabled={syncing}
						>
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center flex-1">
									<Upload size={20} color="#FFFFFF" />
									<View className="ml-3 flex-1">
										<Text className="text-white font-psemibold">Quick Sync</Text>
										<Text className="text-gray-300 text-sm">
											Sync recent changes only
										</Text>
									</View>
								</View>
								{syncing ? (
									<ActivityIndicator size="small" color="#FFFFFF" />
								) : (
									<Download size={20} color="#FFFFFF" />
								)}
							</View>
						</TouchableOpacity>

						{/* Cleanup */}
						<TouchableOpacity
							className={`bg-red-600 rounded-lg p-4 ${cleaningUp ? 'opacity-50' : ''}`}
							onPress={handleCleanup}
							disabled={cleaningUp}
						>
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center flex-1">
									<Trash2 size={20} color="#FFFFFF" />
									<View className="ml-3 flex-1">
										<Text className="text-white font-psemibold">Clean Up Deleted Data</Text>
										<Text className="text-gray-300 text-sm">
											Remove synced deleted items permanently
										</Text>
									</View>
								</View>
								{cleaningUp ? (
									<ActivityIndicator size="small" color="#FFFFFF" />
								) : (
									<Database size={20} color="#FFFFFF" />
								)}
							</View>
						</TouchableOpacity>
					</View>

					{/* Sync Info */}
					<View className="bg-[#1E1B3A] rounded-xl p-4 mb-6">
						<Text className="text-white font-psemibold text-lg mb-3">About Sync</Text>
						
						<View className="space-y-3">
							<View>
								<Text className="text-white font-pmedium mb-1">Full Sync</Text>
								<Text className="text-gray-400 text-sm">
									Uploads your local changes and downloads all data from the cloud. Use this for complete synchronization.
								</Text>
							</View>
							
							<View>
								<Text className="text-white font-pmedium mb-1">Quick Sync</Text>
								<Text className="text-gray-400 text-sm">
									Only syncs recent changes. Faster but may not include all cloud updates.
								</Text>
							</View>
							
							<View>
								<Text className="text-white font-pmedium mb-1">Automatic Sync</Text>
								<Text className="text-gray-400 text-sm">
									Your data automatically syncs when you add, edit, or delete medications.
								</Text>
							</View>
						</View>
					</View>

					{/* Bottom spacing */}
					<View className="h-8" />
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

export default SyncSettings;
