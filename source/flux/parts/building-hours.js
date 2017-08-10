/**
 * @flow
 * Reducer for building hours
 */

import type {Action} from '../types'
import type {BuildingType} from '../../views/building-hours/types'
import {getBuildingHours, setBuildingHours} from '../../lib/storage'

export const UPDATE_HOURS_FAILURE = 'building-hours/UPDATE_HOURS_FAILURE'
export const UPDATE_HOURS_BEGIN = 'building-hours/UPDATE_HOURS_BEGIN'
export const UPDATE_HOURS_SUCCESS = 'building-hours/UPDATE_HOURS_SUCCESS'

export function getHoursFromStorage() {
  return async (dispatch: (Action<*, *>) => void) => {
    const hours = await getBuildingHours()
    dispatch({type: UPDATE_HOURS_SUCCESS, payload: hours || []})
  }
}

const fetchHours = (): Promise<{data: Array<BuildingType>}> =>
  fetchJson('https://stodevx.github.io/AAO-React-Native/building-hours.json')

export function updateHours() {
  return async (dispatch: (Action<*, *>) => void) => {
    try {
      dispatch({type: UPDATE_HOURS_BEGIN})
      const hours = await fetchHours()
      await setBuildingHours(hours.data)
      dispatch({type: UPDATE_HOURS_SUCCESS, payload: hours.data})
    } catch (err) {
      // if is-offline
      // tracker.trackException(err.message)
      // bugsnag.notify(err)
      console.warn(err)
      dispatch({type: UPDATE_HOURS_FAILURE, payload: err})
    }
  }
}

type BuildingHoursShape = {
  hours: Array<BuildingType>,
  error: ?Error,
  loading: boolean,
};
const initialState = {
  hours: [],
  error: null,
  loading: false,
}
export function buildingHours(
  state: BuildingHoursShape = initialState,
  action: Action<*, *>,
) {
  const {type, payload} = action

  switch (type) {
    case UPDATE_HOURS_BEGIN: {
      return {...state, loading: true}
    }

    case UPDATE_HOURS_SUCCESS: {
      return {...state, hours: payload, error: null, loading: false}
    }

    case UPDATE_HOURS_FAILURE: {
      return {...state, error: payload, loading: false}
    }

    default:
      return state
  }
}
