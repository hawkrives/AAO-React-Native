// @flow

import React from 'react'
import {FlatList, Platform, View, Text, StyleSheet} from 'react-native'
import {ListEmpty} from '../components/list'
import * as c from '../components/colors'
import type {
  PrintJobType,
  HeldJobType,
  StatusResponseType,
  PrinterType,
  RecentPopularPrintersResponseType,
  AllPrintersResponseType,
  HeldJobsResponseType
} from './initial-types'

// Mocked data
import allPrinters from './json/all-printers'
import heldJobs from './json/held-jobs'
import loginInfo from './json/login'
import pendingActions from './json/pending-actions'
import recentPrinters from './json/recent'
import status from './json/status'
import userInfo from './json/user'

const styles = StyleSheet.create({
  list: {
    paddingTop: 5,
    marginHorizontal: 5,
  },
  separator: {
    height: 5,
  },
  name: {
    fontWeight: 'bold',
  },
  location: {

  },
  container: {
    flexDirection: 'column',
    paddingLeft: 15,
    height: 72,
    backgroundColor: c.white,
    ...Platform.select({
      ios: {
        paddingVertical: 8,
        paddingRight: 8,
      },
      android: {
        paddingVertical: 16,
        paddingRight: 15,
      },
    }),
  },
})

const PrinterSeparator = () => <View style={styles.separator} />

export default class PrintReleaseView extends React.Component {
  static navigationOptions = {
    title: 'StoPrint',
  }

  keyExtractor = (item: any) => {
    return item.printerName
  }

  render() {
    return (
      <FlatList
        ItemSeparatorComponent={PrinterSeparator}
        ListEmptyComponent={<ListEmpty mode="bug" />}
        style={styles.list}
        data={allPrinters}
        keyExtractor={this.keyExtractor}
        renderItem={({item}: {item: any}) =>
          <View style={styles.container}>
            <Text style={styles.name} selectable={true}>
              {item.printerName}
            </Text>
            <Text style={styles.location} selectable={true}>
              {item.location}
            </Text>
          </View>
        }
      />
    )
  }
}
