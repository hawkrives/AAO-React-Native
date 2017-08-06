/**
 * @flow
 * Reducer for stoprint data
 */

import {loadLoginCredentials} from '../../lib/login'
import buildFormData from '../../lib/formdata'

export const UPDATE_NOTABLE_PRINTERS = 'stoprint/UPDATE_NOTABLE_PRINTERS'
export const UPDATE_ALL_PRINTERS = 'stoprint/UPDATE_ALL_PRINTERS'
export const UPDATE_PRINT_JOBS = 'stoprint/UPDATE_PRINT_JOBS'
export const LOGIN_FAILED = 'stoprint/LOGIN_FAILED'

function _logIn(username, password) {
  const form = buildFormData({password: btoa(password)})
  // console.log(form)
  const url = `https://papercut.stolaf.edu/rpc/api/rest/internal/webclient/users/${username}/log-in`
  // console.log(url)
  let req = fetch(url, {method: 'POST', body: form})
  // console.log(req)
  return req.then(r => r.json())
}

async function logIn(username, password): Promise<boolean> {
  if (!username || !password) {
    // console.log('missing username or password')
    return false
  }
  try {
    const result = await _logIn(username, password)
    // console.log('login result', result)
    if (result.success) {
      return true
    }
  } catch (err) {
    // console.log('login threw an error')
    return false
  }
  return false
}

export function updatePrinters() {
  return async (dispatch: any => any) => {
    const {username, password} = await loadLoginCredentials()
    if (!username || !password) {
      return false
    }

    const success = await logIn(username, password)
    if (!success) {
      return dispatch({
        type: LOGIN_FAILED,
        error: true,
        payload: 'Login failed',
      })
    }

    const url = `https://papercut.stolaf.edu:9192/rpc/api/rest/internal/mobilerelease/api/all-printers?username=${username}`
    const printers = await fetch(url).then(r => r.json())

    dispatch({
      type: UPDATE_ALL_PRINTERS,
      payload: printers,
    })
  }
}

export function updatePrintJobs() {
  return async (dispatch: any => any) => {
    const {username, password} = await loadLoginCredentials()
    if (!username || !password) {
      // console.log('no credentials')
      return false
    }
    // console.log('yes credentials')

    const success = await logIn(username, password)
    if (!success) {
      // console.log('not logged in')
      return dispatch({
        type: LOGIN_FAILED,
        error: true,
        payload: 'Login failed',
      })
    }
    // console.log('yes logged in')

    const url = `https://papercut.stolaf.edu:9192/rpc/api/rest/internal/webclient/users/${username}/jobs/status`
    const {jobs} = await fetch(url).then(r => r.json())

    // console.log('data', jobs)

    dispatch({
      type: UPDATE_PRINT_JOBS,
      payload: jobs,
    })

    // console.log('done')
  }
}

const initialPrintersState = {printers: [], error: null}
function printers(state = initialPrintersState, action) {
  const {type, payload, error} = action

  switch (type) {
    case LOGIN_FAILED:
      return {...state, error: payload}

    case UPDATE_ALL_PRINTERS:
      return {...state, printers: payload, error: null}

    default:
      return state
  }
}

const initialJobsState = {jobs: [], error: null}
function jobs(state = initialJobsState, action) {
  const {type, payload} = action

  switch (type) {
    case UPDATE_PRINT_JOBS:
      return {...state, jobs: payload, error: null}

    case LOGIN_FAILED:
      return {...state, error: payload}

    default:
      return state
  }
}

const initialStoprintPageState = {}
export function stoprint(state: Object = initialStoprintPageState, action: Object) {
  console.log(action)
  return {
    printers: printers(state.printers, action),
    jobs: jobs(state.jobs, action),
  }
}
