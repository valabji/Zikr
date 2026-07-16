import * as Linking from 'expo-linking';


export default {
    prefixes: [Linking.createURL('/')],
    config: {
        path: 'root',
        screens: {
          Home: 'home',
          Links: 'links',
          Settings: 'settings',
        },
      },
  }