/**
 * @flow
 *
 * Building Hours view. This component loads data from either GitHub or
 * the local copy as a fallback, and renders the list of buildings.
 */

import React from 'react'
import {NoticeView} from '../components/notice'
import {BuildingHoursList} from './list'
import {connect} from 'react-redux'
import moment from 'moment-timezone'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'
import toPairs from 'lodash/toPairs'
import groupBy from 'lodash/groupBy'
import {updateHours} from '../../flux/parts/building-hours'
import {CENTRAL_TZ} from './lib'

const groupBuildings = (buildings: BuildingType[]) => {
  const grouped = groupBy(buildings, b => b.category || 'Other')
  return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

export class BuildingHours extends React.Component {
  static navigationOptions = {
    title: 'Building Hours',
    headerBackTitle: 'Hours',
  }

  state: {
    now: moment,
    intervalId: number,
  } = {
    // now: moment.tz('Wed 7:25pm', 'ddd h:mma', null, CENTRAL_TZ),
    now: moment.tz(CENTRAL_TZ),
    intervalId: 0,
  }

  componentWillMount() {
    // This updates the screen every ten seconds, so that the building
    // info statuses are updated without needing to leave and come back.
    this.setState(() => ({intervalId: setInterval(this.updateTime, 10000)}))
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  props: TopLevelViewPropsType & {
    loading: boolean,
    error: ?Error,
    buildings: Array<{title: string, data: BuildingType[]}>,
    updateHours: () => Promise<any>,
  }

  updateTime = () => this.setState(() => ({now: moment.tz(CENTRAL_TZ)}))

  fetchData = async () => {
    await this.props.updateHours()
    this.updateTime()
  }

  render() {
    if (this.props.error) {
      return <NoticeView text={`Error: ${this.props.error.message}`} />
    }

    return (
      <BuildingHoursList
        buildings={this.props.buildings}
        loading={this.props.loading}
        navigation={this.props.navigation}
        now={this.state.now}
        onRefresh={this.fetchData}
      />
    )
  }
}

const mapStateToProps = state => ({
  buildings: groupBuildings(state.buildingHours.hours),
  error: state.buildingHours.error,
  loading: state.buildingHours.loading,
})

const mapDispatchToProps = dispatch => ({
  updateHours: () => dispatch(updateHours()),
})

export const BuildingHoursView = connect(mapStateToProps, mapDispatchToProps)(
  BuildingHours,
)
