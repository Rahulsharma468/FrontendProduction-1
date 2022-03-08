import AsyncStorage from '@react-native-community/async-storage';
import React from 'react';
import {
  Alert,
  BackHandler,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import CheckBox from '@react-native-community/checkbox';
import {
  editProfile,
  getUserDetails,
  uploadProfilePic,
} from '../apiServices/userProfileApi';
import {errorMessage} from '../global/utils';

import {serviceProviders} from '../global/constant';
import DropDownPicker from 'react-native-dropdown-picker';

interface UserProfileProps {
  navigation: any;
}
interface UserProfileState {
  userProfileImage: any | null;
  privacyPolicy: boolean;
  userEmail: string;
  userName: string;
  userAddress: string;
  userExperience: string;
  userServiceProviderType: any;
  dropDownOpen: boolean;
  userPhoneNumber: string;
  termsAndCondition: boolean;
  showEditableContent: boolean;
  loading: boolean;
}
const userProfileImage = require('../assets/userProfileImage.png');
class UserProfile extends React.Component<UserProfileProps, UserProfileState> {
  constructor(props: UserProfileProps) {
    super(props);

    this.state = {
      userProfileImage: null,
      privacyPolicy: true,
      userExperience: '',
      userEmail: '',
      userAddress: '',
      userName: '',
      userServiceProviderType: undefined,
      dropDownOpen: false,
      userPhoneNumber: '',
      termsAndCondition: true,
      showEditableContent: true,
      loading: false,
    };
    this.setServiceProviderType = this.setServiceProviderType.bind(this);
  }
  async componentDidMount() {
    this.setState({loading: true});
    const userObject = await AsyncStorage.getItem('userObject');
    const phoneNumber = JSON.parse(userObject as string).userPhoneNumber;
    const fixitID = JSON.parse(userObject as string).fixitId;
    const newUserFlag = JSON.parse(userObject as string).newUser;
    this.setState({userPhoneNumber: phoneNumber});
    if (newUserFlag) {
      this.setState({showEditableContent: false});
    }
    if (!newUserFlag) this.getUserDetailsForReadableContent(fixitID);
    this.setState({loading: false});
    // this.props.navigation.addListener('beforeRemove', (event: any) => {
    //   event.preventDefault();
    //   Alert.alert('Exit AskMechanics', 'Do you want to exit?', [
    //     {
    //       text: 'No',
    //       onPress: () => console.log('Cancel Pressed'),
    //       style: 'cancel',
    //     },
    //     {text: 'Yes', onPress: () => BackHandler.exitApp()},
    //   ]);
    // });
  }
  getUserDetailsForReadableContent = (fixitId: string) => {
    getUserDetails(fixitId).then((response: any) => {
      const userDetails = response.data;
      this.setState({
        userEmail: userDetails['Mr.Fixit Email'],
        userAddress: userDetails['Mr.Fixit Worskshop Adress'],
        userExperience: userDetails['Mr.Fixit Experience'],
        userName: userDetails['Mr.FixitName'],
        userServiceProviderType:
          userDetails['Mr.Fixit Specialization'] &&
          userDetails['Mr.Fixit Specialization'][0],
      });
    });
  };
  choosePhotoFromTheStorage() {
    var options: any = {
      title: 'Select Image',
      customButtons: [
        {
          name: 'customOptionKey',
          title: 'Choose Photo from Custom Option',
        },
      ],
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    launchImageLibrary(options, async (response: any) => {
      console.log('Response = ', response);
      if (response.didCancel) {
        errorMessage('Pick an image');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        errorMessage('Something went wrong :(');
      }
      //   (response.customButton);
      else {
        if (response.assets.length != 1) {
          errorMessage('Please select an image');
          return;
        }
        const asset = response.assets[0];
        const formData = new FormData();
        if (asset.fileSize > 3000000) {
          errorMessage('Please select an image below 3MB');
          return;
        }
        formData.append('imageFile', asset);
        const userObject = await AsyncStorage.getItem('userObject');
        const fixitID = JSON.parse(userObject as string).fixitId;
        console.log(formData);
        uploadProfilePic(formData, fixitID)
          .then((response: any) => {
            console.log(response);
          })
          .catch(error => {
            console.log(error);
          });
      }
    });
  }
  setServiceProviderType = (callback: any) => {
    this.setState(state => ({
      userServiceProviderType: callback(state.userServiceProviderType),
    }));
    console.log(this.state.userServiceProviderType);
  };
  handleSubmitProfile = async () => {
    if (
      !(
        this.state.userName &&
        this.state.userAddress &&
        this.state.userEmail &&
        this.state.userExperience &&
        this.state.userServiceProviderType
      )
    ) {
      errorMessage('Please fill everything');
      return;
    }
    if (!(this.state.privacyPolicy && this.state.termsAndCondition)) {
      errorMessage('Please accept the terms');
      return;
    }
    let userObject = await AsyncStorage.getItem('userObject');
    const fixitId = JSON.parse(userObject as string).fixitId;
    const userType = JSON.parse(userObject as string).userType;
    editProfile(
      this.state.userEmail,
      this.state.userExperience,
      this.state.userName,
      fixitId,
      this.state.userAddress,
      this.state.userServiceProviderType,
    )
      .then(async (response: any) => {
        console.log(response);
        if (response.status === 200) {
          await AsyncStorage.removeItem('userObject');
          const newUserObject = JSON.stringify({
            newUser: false,
            userName: this.state.userName,
            userPhoneNumber: this.state.userPhoneNumber,
            fixitId: fixitId,
            userType: userType,
          });
          console.log('Storage in profiel : ' + userObject);
          AsyncStorage.setItem('userObject', newUserObject).then(() =>
            this.props.navigation.navigate('DashBoardView'),
          );
        } else {
          errorMessage('Something went wrong :(');
        }
      })
      .catch((error: any) => {
        console.log(error);
        errorMessage('Something went wrong :(');
      });
  };
  handleBack = async () => {
    let userObject = await AsyncStorage.getItem('userObject');
    console.log(userObject);
    const newUserFlag = JSON.parse(userObject as string).newUser;
    console.log(newUserFlag);
    this.props.navigation.navigate('DashBoardView');
  };
  render() {
    if (this.state.loading) {
      return (
        <View style={styles.userProfileContainer}>
          <ActivityIndicator
            animating={this.state.loading}
            color="blue"
            size="large"
            style={styles.activityIndicator}
          />
        </View>
      );
    }
    if (!this.state.loading && this.state.showEditableContent) {
      return (
        <View style={styles.userProfileContainer}>
          <TouchableOpacity
            style={styles.drawerStyle}
            onPress={this.handleBack}>
            <Image
              source={require('../assets/meat.png')}
              style={styles.iconStyle}
            />
          </TouchableOpacity>
          <ScrollView
            style={styles.sectionStyle}
            nestedScrollEnabled={true}
            contentContainerStyle={{justifyContent: 'center'}}>
            <View style={styles.profilePicSection}>
              {/* <Image
              source={require(this.state.userProfileImage)}
              style={{width: 20, height: 20}}
            /> */}

              <TouchableOpacity
                style={{
                  marginTop: 5,
                  height: 100,
                  width: 100,
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
                onPress={this.choosePhotoFromTheStorage}>
                <Image
                  source={userProfileImage}
                  style={{width: '100%', height: '100%'}}
                />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, {marginTop: '10%'}]}>
              <Text style={styles.readAbleTitle}>Name:</Text>
              <Text style={styles.fieldTextStyle}>
                {this.state.userName || 'Not Set'}
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.readAbleTitle}>User Type:</Text>
              <Text style={styles.fieldTextStyle}>
                {this.state.userServiceProviderType || 'Not Set'}
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.readAbleTitle]}>Phone Number:</Text>
              <Text style={styles.fieldTextStyle}>
                {this.state.userPhoneNumber}
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.readAbleTitle]}>Work-shop Address:</Text>
              <Text style={styles.fieldTextStyle}>
                {this.state.userAddress || 'Not set'}
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.readAbleTitle]}>Work Experience:</Text>
              <Text style={styles.fieldTextStyle}>
                {this.state.userExperience || 'Not set'}
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.readAbleTitle]}>Email:</Text>
              <Text style={styles.fieldTextStyle}>
                {this.state.userEmail || 'Not Set'}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buttonStyle}
                onPress={() => {
                  this.setState({
                    showEditableContent: !this.state.showEditableContent,
                  });
                }}>
                <Text style={styles.buttonTextStyle}>Edit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    } else if (!this.state.loading && !this.state.showEditableContent) {
      return (
        <View style={styles.userProfileContainer}>
          <TouchableOpacity
            style={styles.drawerStyle}
            onPress={this.handleBack}>
            <Image
              source={require('../assets/meat.png')}
              style={styles.iconStyle}
            />
          </TouchableOpacity>
          <ScrollView
            style={styles.sectionStyle}
            nestedScrollEnabled={true}
            contentContainerStyle={{justifyContent: 'center'}}>
            <View style={styles.profilePicSection}>
              {/* <Image
              source={require(this.state.userProfileImage)}
              style={{width: 20, height: 20}}
            /> */}

              <TouchableOpacity
                style={{
                  marginTop: 5,
                  height: 100,
                  width: 100,
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
                onPress={this.choosePhotoFromTheStorage}>
                <Image
                  source={userProfileImage}
                  style={{width: '100%', height: '100%'}}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputTitle}>Name:</Text>
              <TextInput
                style={styles.inputStyle}
                placeholder="Enter your workshop name"
                onChangeText={(name: string) => {
                  this.setState({userName: name});
                }}
                value={this.state.userName}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputTitle}>Email:</Text>
              <TextInput
                style={styles.inputStyle}
                placeholder="Enter your Email"
                onChangeText={(email: string) => {
                  this.setState({userEmail: email});
                }}
                value={this.state.userEmail}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputTitle}>Experience:</Text>
              <TextInput
                style={styles.inputStyle}
                placeholder="Enter your Experience"
                onChangeText={(experience: string) => {
                  this.setState({userExperience: experience});
                }}
                value={this.state.userExperience}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputTitle}>Service Category:</Text>
              <DropDownPicker
                open={this.state.dropDownOpen}
                value={this.state.userServiceProviderType}
                items={serviceProviders}
                zIndex={1000}
                zIndexInverse={3000}
                setOpen={() => {
                  this.setState({dropDownOpen: !this.state.dropDownOpen});
                }}
                setValue={this.setServiceProviderType}
                style={styles.inputStyle}
                itemSeparator={true}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputTitle}>Workshop Address:</Text>
              <TextInput
                style={styles.inputStyle}
                placeholder="Enter your address"
                multiline={true}
                onChangeText={(address: string) => {
                  this.setState({userAddress: address});
                }}
                value={this.state.userAddress}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.inputTitle,
                  {
                    width: '100%',
                    marginTop: 20,
                    fontSize: 16,
                    height: 20,
                    color: 'black',
                  },
                ]}>
                {'Your Phone Number is ' + this.state.userPhoneNumber}
              </Text>
            </View>
            <View style={styles.checkboxContainer}>
              <Text
                style={{
                  color: 'blue',
                  fontSize: 14,
                  fontWeight: '600',
                  marginRight: 5,
                }}
                onPress={() => {
                  Linking.openURL('https://askmechanics.in/privacy-policy');
                }}>
                Privacy Policy
              </Text>
              <CheckBox
                value={this.state.privacyPolicy}
                onChange={(event: any) => {
                  this.setState({
                    privacyPolicy: !this.state.privacyPolicy,
                  });
                }}></CheckBox>
            </View>
            <View style={styles.checkboxContainer}>
              <Text
                style={{
                  color: 'blue',
                  fontSize: 14,
                  fontWeight: '600',
                  marginRight: 5,
                }}
                onPress={() => {
                  Linking.openURL(
                    'https://askmechanics.in/terms-and-conditions',
                  );
                }}>
                Terms & Conditions
              </Text>
              <CheckBox
                value={this.state.termsAndCondition}
                onChange={(event: any) => {
                  this.setState({
                    termsAndCondition: !this.state.termsAndCondition,
                  });
                }}></CheckBox>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={this.handleSubmitProfile}
                style={styles.buttonStyle}>
                <Text style={styles.buttonTextStyle}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }
  }
}
const styles = StyleSheet.create({
  userProfileContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9d342',
    width: '100%',
    height: '100%',
  },
  activityIndicator: {
    alignItems: 'center',
    height: 80,
  },
  fieldTextStyle: {
    textAlign: 'left',
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  sectionStyle: {
    flex: 1,
    padding: 8,
    flexDirection: 'column',
    alignContent: 'center',
    minHeight: '70%',
    marginTop: '20%',
    backgroundColor: 'white',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 6,
  },
  drawerStyle: {
    width: '100%',
    justifyContent: 'flex-start',
    marginTop: 35,
    paddingLeft: 20,
  },
  iconStyle: {
    width: 30,
    height: 30,
  },
  profilePicSection: {
    width: '100%',
    height: '15%',
    alignContent: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    height: 45,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 3,
  },
  inputStyle: {
    marginLeft: 10,
    width: '60%',
    height: '100%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'grey',
    fontSize: 14,
    borderRadius: 4,
    paddingLeft: 5,
  },
  inputTitle: {width: '35%', fontSize: 14, color: 'black', fontWeight: 'bold'},
  readAbleTitle: {
    width: '45%',
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  buttonStyle: {
    backgroundColor: '#f9d342',
    padding: 10,
    width: 100,
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonTextStyle: {
    fontWeight: '900',
    color: 'black',
    fontSize: 16,
  },
});

export default UserProfile;
