import React, { useState, useEffect, Component } from 'react'
import './styles/style.scss'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom'

import EligibilityRegistration from './components/registration/EligibilityRegistration'
import SurveyWrapper from './components/surveys/SurveyWrapper'
import Done from './components/surveys/Done'
import Login from './components/login/Login'
import Consent from './components/consent/Consent'
import { useSessionDataState, useSessionDataDispatch } from './AuthContext'

import { makeStyles } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline/CssBaseline'
import {
  createMuiTheme,
  ThemeProvider,
  Typography,
  Grid,
} from '@material-ui/core'

import { getSearchParams } from './helpers/utility'

import Intro from './components/static/Intro'
import Dashboard from './components/dashboard/Dashboard'
import ConsentEHR from './components/consent/ConsentEHR'
import Team from './components/static/Team'
import Contact from './components/static/Contact'
import FAQs from './components/static/FAQs'
import { TopNav } from './components/widgets/TopNav'
import { UserService } from './services/user.service'
import AcountSettings from './components/AccountSettings'
import GoogleAnalyticsPageTracker from './components/widgets/GoogleAnalyticsPageTracker'
import CookieNotificationBanner from './components/widgets/CookieNotificationBanner'
import ScrollToTopOnRouteChange from './components/widgets/ScrollToTopOnRouteChange'
import Footer from './components/widgets/Footer'
import PrivacyPolicy from './components/static/PrivacyPolicy'
import Appointment from './components/static/Appointment'
import Result from './components/static/Result'
import { userInfo } from 'os'
import { UserDataGroup, SessionData } from './types/types'

export const openSansFont = [
  'Open Sans',
  'serif',
  'Lato',
  'Roboto',
  'Helvetica',
  'Arial',
].join(',')

export const playfairDisplayFont = [
  'Playfair Display',
  'serif',
  'Lato',
  'Roboto',
  'Helvetica',
  'Arial',
].join(',')

const defaultTheme = createMuiTheme()
const theme = createMuiTheme({
  typography: {
    // Tell Material-UI what's the font-size on the html element is.
    htmlFontSize: 10,
    fontFamily: openSansFont,
    button: {
      textTransform: 'none',
    },
  },
  palette: {
    background: {
      //default: '#e5e5e5'
    },
    primary: {
      // light: will be calculated from palette.primary.main,
      main: '#0085FF', ///'#202423' //'#ff4400',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      //light: '#0066ff',
      main: '#ccc',
      // dark: will be calculated from palette.secondary.main,
      //contrastText: '#ffcc00',
    },
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: 3,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2,
  },
  props: {
    // Name of the component ⚛️
    MuiButtonBase: {
      // The properties to apply
      disableRipple: true, // No more ripple, on the whole application 💣!
    },
  },
  overrides: {
    MuiButton: {
      root: {
        borderRadius: 25,
        height: 47,
        fontFamily: openSansFont,
      },
      text: {
        borderRadius: 25,
        height: 47,
        fontFamily: openSansFont,
        color: '#0084FF',
        '&:hover': {
          background: 'none',
          textDecoration: 'underline',
        },
      },
    },
    MuiInputBase: {
      root: {
        fontFamily: openSansFont,
      },
    },
    MuiCard: {
      root: {
        backgroundColor: '#f5f5f5',
        maxWidth: '511px',
        margin: '0 auto',
      },
    },
    MuiCardContent: {
      root: {
        [defaultTheme.breakpoints.up('md')]: {
          padding: '46px',
        },

        '&:last-child': {
          [defaultTheme.breakpoints.up('md')]: {
            paddingBottom: '46px',
          },
        },
      },
    },
  },
})

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
  },
}))

function renderWithGridLayout(el: JSX.Element) {
  return (
    <Grid
      container
      direction="row"
      justify="center"
      alignItems="center"
      spacing={2}
      style={{ padding: '24px' }}
    >
      <Grid item xs={12} md={8} lg={6}>
        {el}
      </Grid>
    </Grid>
  )
}

function App() {
  const sessionData = useSessionDataState()
  const sessionUpdateFn = useSessionDataDispatch()
  const token = sessionData.token
  const consented = sessionData.consented
  const [currentLocation, setCurrentLocation] = useState(
    window.location.pathname,
  )
  const [userGroups, setUserGroups] = useState<UserDataGroup[]>([])

  useEffect(() => {
    let isSubscribed = true
    //the whole point of this is to log out the user if their session ha expired on the servier
    async function getInfo(token: string | undefined) {
      if (token && isSubscribed) {
        try {
          const userInfo = await UserService.getUserInfo(token)
          setUserSession(
            token,
            userInfo.data.firstName,
            userInfo.data.consented,
            userInfo.data.dataGroups,
          )
        } catch (e) {
          setUserSession(undefined, '', false, [])
        }
      }
    }
    getInfo(token)
    return () => {
      isSubscribed = false
    }
  }, [token])

  function PrivateRoute({ children, ...rest }: any) {
    return (
      <Route
        {...rest}
        render={({ location }) =>
          token ? (
            children
          ) : (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: location },
              }}
            />
          )
        }
      />
    )
  }

  function ConsentedRoute({ children, ...rest }: any) {
    return (
      <Route
        {...rest}
        render={({ location }) => {
          if (!token) {
            return (
              <Redirect
                to={{
                  pathname: '/login',
                  state: { from: location },
                }}
              />
            )
          }
          if (!sessionData.consented) {
            return (
              <Redirect
                to={{
                  pathname: '/consent',
                  state: { from: location },
                }}
              />
            )
          }
          return children
        }}
      />
    )
  }

  function getDashboardPage(sessionData: SessionData) {
    if (sessionData.userDataGroup.includes('tests_available') || sessionData.userDataGroup.includes('tests_collected')) {
      return renderWithGridLayout(<Result token={token || ''} />)
    }
    if (sessionData.userDataGroup.includes('tests_scheduled')) {
      return renderWithGridLayout(<Appointment token={token || ''} />)
    }
    return renderWithGridLayout(<Dashboard token={token || ''} />)
  }

  const setUserSession = (
    token: string | undefined,
    name: string,
    consented: boolean,
    dataGroup: UserDataGroup[],
  ) => {
    if (!token) {
      sessionUpdateFn({ type: 'LOGOUT' })
    } else {
      sessionUpdateFn({
        type: 'LOGIN',
        payload: {
          ...sessionData,
          token: token,
          name: name,
          consented: consented,
          userDataGroup: dataGroup,
        },
      })
    }
  }

  const classes = useStyles()

  const getTopClass = (location: string) => {
    const alertClass = !!sessionData.alert ? ' hasAlert' : ''
    const specialPages = ['survey', 'contactinfo', 'appointment']
    if (specialPages.find(page => location.toLowerCase().includes(page))) {
      return `partialGreen${alertClass}`
    }
    //dashboard is green for users to haven't tested
    if (
      location.toLowerCase().includes('dashboard') &&
      sessionData.userDataGroup.indexOf('tests_available') === -1
    ) {
      return `partialGreen${alertClass}`
    } else {
      return ''
    }
  }

  const shouldShowFooter = (location: string): boolean => {
    const specialPages = ['dashboard', 'survey', 'contactinfo', 'consent']
    return (
      specialPages.find(page => location.toLowerCase().includes(page)) ===
      undefined
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Typography component={'div'}>
        <div className={classes.root}>
          <CssBaseline />
          <Router>
            <div className={getTopClass(currentLocation)}>
              <CookieNotificationBanner />
              <GoogleAnalyticsPageTracker />
              <ScrollToTopOnRouteChange
                onRouteChangeFn={(location: string) =>
                  setCurrentLocation(location)
                }
              />
              <TopNav
                token={token}
                logoutCallbackFn={() =>
                  setUserSession(undefined, '', false, [])
                }
              >
                {/* A <Switch> looks through its children <Route>s and
        renders the first one that matches the current URL. */}{' '}
                <Switch>
                  <Route
                    exact={true}
                    path="/login"
                    render={props => {
                      const searchParamsProps = getSearchParams(
                        props.location.search,
                      )
                      // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams -- needs polyfill for ie11
                      return renderWithGridLayout(
                        <Login
                          {...props}
                          key={Math.random()}
                          searchParams={searchParamsProps as any}
                          callbackFn={(
                            token: string,
                            name: string,
                            consented: boolean,
                            dataGroup: UserDataGroup[],
                          ) =>
                            setUserSession(token, name, consented, dataGroup)
                          }
                        />,
                      )
                    }}
                  ></Route>
                  <Route
                    path="/eligibility"
                    render={props => {
                      const searchParamsProps = getSearchParams(
                        props.location.search,
                      )
                      // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams -- needs polyfill for ie11
                      return renderWithGridLayout(
                        <EligibilityRegistration
                          {...props}
                          callbackFn={(token: string, name: string) =>
                            setUserSession(token, name, false, [])
                          }
                        />,
                      )
                    }}
                  ></Route>

                  <ConsentedRoute exact={true} path="/dashboard">
                    {getDashboardPage(sessionData)}
                  </ConsentedRoute>
                  {/*todo make private */}
                  <Route exact={true} path="/consent">
                    {renderWithGridLayout(<Consent token={token || ''} />)}
                  </Route>
                  {/*todo make private */}
                  <Route exact={true} path="/consentehr">
                    {renderWithGridLayout(<ConsentEHR token={token || ''} />)}
                  </Route>
                  {/*todo make private */}
                  <ConsentedRoute exact={true} path="/contactinfo">
                    {renderWithGridLayout(
                      <SurveyWrapper
                        formTitle="Tell us about yourself"
                        token={token || ''}
                        surveyName={'CONTACT'}
                        formClass="crc"
                      ></SurveyWrapper>,
                    )}
                  </ConsentedRoute>
                  <ConsentedRoute exact={true} path="/survey1">
                    {renderWithGridLayout(
                      <SurveyWrapper
                        formTitle="Tell us about yourself"
                        token={token || ''}
                        surveyName={'DEMOGRAPHIC'}
                        formClass="crc"
                      ></SurveyWrapper>,
                    )}
                  </ConsentedRoute>
                  <ConsentedRoute exact={true} path="/survey2">
                    {renderWithGridLayout(
                      <SurveyWrapper
                        formTitle="Your COVID experience"
                        token={token || ''}
                        surveyName={'COVID_EXPERIENCE'}
                        formClass="crc"
                      ></SurveyWrapper>,
                    )}
                  </ConsentedRoute>
                  <ConsentedRoute exact={true} path="/survey3">
                    {renderWithGridLayout(
                      <SurveyWrapper
                        formTitle="Health History"
                        token={token || ''}
                        surveyName={'HISTORY'}
                        formClass="crc"
                      ></SurveyWrapper>,
                    )}
                  </ConsentedRoute>
                  <ConsentedRoute exact={true} path="/survey4">
                    {renderWithGridLayout(
                      <SurveyWrapper
                        formTitle="COVID Part II"
                        token={token || ''}
                        surveyName={'MORE'}
                        formClass="crc"
                      ></SurveyWrapper>,
                    )}
                  </ConsentedRoute>
                  <ConsentedRoute exact={true} path="/appointment">
                    {renderWithGridLayout(<Appointment token={token || ''} />)}
                  </ConsentedRoute>
                  <ConsentedRoute exact={true} path="/result">
                    {renderWithGridLayout(<Result token={token || ''} />)}
                  </ConsentedRoute>

                  <Route path="/faqs">
                    <FAQs />
                  </Route>
                  <Route path="/team">
                    <Team />
                  </Route>
                  <Route path="/contact">
                    <Contact />
                  </Route>
                  <Route path="/privacypolicy">
                    <PrivacyPolicy />
                  </Route>

                  <Route path="/settings">
                    {renderWithGridLayout(
                      <AcountSettings token={token!}></AcountSettings>,
                    )}
                  </Route>
                  <Route path="/done">{renderWithGridLayout(<Done />)}</Route>
                  <Route path="/home">
                    <Intro token={token || null}></Intro>
                  </Route>
                  <Route path="/">
                    <Intro token={token || null}></Intro>
                  </Route>
                </Switch>
              </TopNav>
              {shouldShowFooter(currentLocation) && <Footer token={token} />}
            </div>
          </Router>
        </div>
      </Typography>
    </ThemeProvider>
  )
}

export default App
