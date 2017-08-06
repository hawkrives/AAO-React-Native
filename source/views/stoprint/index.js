// @flow

import React from 'react'
import {SectionList, StyleSheet} from 'react-native'
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

  props: TopLevelViewPropsType & {
    jobs: Array<PrintJobType>,
    printers: Array<PrinterType>,

    updatePrinters: () => any,
    updatePrintJobs: () => any,
  }

  refresh = async () => {
    let start = Date.now()
    this.setState({loading: true})

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    await delay(500 - elapsed)

    this.setState({loading: false})
  }

  fetchData = async () => {
    await this.props.updatePrintJobs()
  }

  keyExtractor = (item: PrintJobType) => {
    return item.printerName
  }

  render() {
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
        renderItem={({item}: {item: PrintJobType}) =>
          <ListRow>
            <Title>{item.documentName}</Title>
          </ListRow>
        }
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

