// @flow

import React from 'react'
import {SectionList, StyleSheet, View, Text, Button} from 'react-native'
import {connect} from 'react-redux'
import {ListEmpty} from '../components/list'
import {updatePrinters, updatePrintJobs} from '../../flux/parts/stoprint'
import type {
  PrintJobType,
  HeldJobType,
  StatusResponseType,
  PrinterType,
  RecentPopularPrintersResponseType,
  AllPrintersResponseType,
  HeldJobsResponseType
} from './initial-types'
import {
  ListRow,
  ListSeparator,
  ListSectionHeader,
  Detail,
  Title,
} from '../components/list'
import type {TopLevelViewPropsType} from '../types'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import delay from 'delay'

const styles = StyleSheet.create({
  list: {
    paddingTop: 5,
    marginHorizontal: 5,
  },
})

class PrintReleaseView extends React.PureComponent {
  static navigationOptions = {
    title: 'StoPrint',
  }

  state = {
    loading: false,
  }

  componentWillMount = () => {
    this.refresh()
  }

  props: TopLevelViewPropsType & {
    jobs: Array<PrintJobType>,
    printers: Array<PrinterType>,

    credentialsValid: boolean,

    updatePrinters: () => any,
    updatePrintJobs: () => Promise<any>,
  }

  refresh = async () => {
    let start = Date.now()
    this.setState(() => ({loading: true}))

    await this.fetchData()
    // console.log('data returned')

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    // console.log('waiting for', elapsed, 'ms')
    await delay(500 - elapsed)
    // console.log('done waiting')

    this.setState(() => ({loading: false}))
  }

  fetchData = () => {
    return this.props.updatePrintJobs()
  }

  keyExtractor = (item: PrintJobType) => {
    return item.printerName
  }

  openSettings = () => {
    this.props.navigation.navigate('SettingsView')
  }

  renderItem = ({item}: {item: PrintJobType}) =>
          <ListRow>
            <Title>{item.documentName}</Title>
          </ListRow>

  render() {
    if (!this.props.credentialsValid) {
      return <View>
        <Text>You are not logged in.</Text>
        <Button onPress={this.openSettings} title="Open Settings" />
      </View>
    }

    const jobs = toPairs(groupBy(this.props.printers, j => j.printerName)).map(([title, data]) => ({title, data}))

    return (
      <SectionList
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<ListEmpty mode="bug" />}
        style={styles.list}
        sections={jobs}
        refreshing={this.state.loading}
        onRefresh={this.refresh}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
      />
    )
  }
}


function mapStateToProps(state) {
  return {
    printers: state.stoprint.printers.printers,
    jobs: state.stoprint.jobs.jobs,
    printerError: state.stoprint.printers.error,
    jobsError: state.stoprint.jobs.error,
    credentialsValid: state.settings.credentials.valid,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updatePrinters: () => dispatch(updatePrinters()),
    updatePrintJobs: () => dispatch(updatePrintJobs()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PrintReleaseView)

