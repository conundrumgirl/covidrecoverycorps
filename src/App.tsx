import React, { useState } from 'react'
import logo from './logo.svg'

import './styles/style.scss'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from 'react-router-dom'
import Collaborators from './components/static/Collaborators'
import PatientCorpsHome from './components/PatientCorpsHome'
import EligibilityRegistration from './components/registration/EligibilityRegistration'
import SurveyWrapper from './components/SurveyWrapper'
import Login from './components/Login'
import Consent from './components/consent/Consent'
import Container from '@material-ui/core/Container/Container'
import { makeStyles } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline/CssBaseline'
import { createMuiTheme, ThemeProvider, Typography, Grid } from '@material-ui/core'

import {getSession} from './helpers/utility'
import PatientCorpsInfo from './components/PatientCorpsInfo'
import Intro from './components/Intro'
import Dashboard from './components/Dashboard'
import { Logout } from './components/Logout'

const theme = createMuiTheme({
  typography: {
    // Tell Material-UI what's the font-size on the html element is.
    htmlFontSize: 10,
    fontFamily: ['Lato', 'Roboto', 'Helvetica', 'Arial'].join(','),
  },
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: '#000', ///'#202423' //'#ff4400',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      light: '#0066ff',
      main: '#0044ff',
      // dark: will be calculated from palette.secondary.main,
      contrastText: '#ffcc00',
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
})

const useStyles = makeStyles((theme) => ({
  root: {
    //backgroundColor: '#E5E5E5'
  },
}))



type AppState = {
  token: string
}
export const TokenContext = React.createContext('')




function App() {

const [token, setToken] = useState(getSession()?.token)
const [name, setName] = useState(getSession()?.name)

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

const renderLoginOut = (


): JSX.Element => {
  let link = <></>
  if (token) {
    link = <><p>Hello {name}</p>
    <Logout onLogout={() => setToken(undefined)}></Logout>
</>
  } else {
   link = <a href="/login">Login</a>
  }

  return <div >{link}</div>
}

  const classes = useStyles()

  const getSearchParams = (search: string): { [key: string]: string } => {
    const searchParamsProps: any = {}
    // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams -- needs polyfill for ie11
    const searchParams = new URLSearchParams(search)
    searchParams.forEach((value, key) => {
      console.log(key)
      searchParamsProps[key] = value
    })
    return searchParamsProps
  }
  return (
    <ThemeProvider theme={theme}>
      <Typography component={'div'}>
        <div className={classes.root}>
          <CssBaseline />
          <Router>
            <div>
              <nav
                style={{
                  border: '1px solid black',
                  width: '200px',
                  top: '10px',
                  left: '10px',
                  fontSize: '.5rem',
                  position: 'fixed'
                }}
              >
                  
                <p> FOR DEV NAV PURPOSES ONLY. (thur 9:15) </p>
                {renderLoginOut()}
                <ul >
                  <li>
                    <Link to="/">Home</Link>
                  </li>
                  <li>
                    <Link to="/collaborators">Collaborators</Link>
                  </li>
                
                  <li>
                    <Link to="/eligibility">Eligibility</Link>
                  </li>

                  <li>
                    <Link to="/survey1">Survey1</Link>
                  </li>

                  
                </ul>
              </nav>
              <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
                spacing={2}
              >
                <Grid item xs={10} md={6} lg={4}>
                  {/* A <Switch> looks through its children <Route>s and
          renders the first one that matches the current URL. */}
                  <Switch>
                    <Route path="/collaborators">
                      <Collaborators />
                    </Route>

                    <Route
                      exact={true}
                      path="/login"
                      render={(props) => {
                        const searchParamsProps = getSearchParams(
                          props.location.search
                        )
                        // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams -- needs polyfill for ie11
                        return <Login {...props} searchParams={searchParamsProps as any}  callbackFn={(token: string, name: string)=> {setToken(token); setName(name)}} />
                      }}
                    ></Route>
                    <Route path="/eligibility">
                      <EligibilityRegistration />
                    </Route>

                    <PrivateRoute exact={true} path="/dashboard">
                      <Dashboard token={token || ''}  />
                    </PrivateRoute>

                    <PrivateRoute exact={true} path="/consent">
                      <Consent token={token || ''} name={getSession()?.name || ''} />
                    </PrivateRoute>

                    <PrivateRoute exact={true} path="/survey1">
                      <SurveyWrapper
                        formTitle="Tell us about yourself"
                        token={token || ''}
                        surveyName={'DEMOGRAPHIC'}
                        formClass="crc"
                      ></SurveyWrapper>
                    </PrivateRoute>

                    <Route path="/">
                      <Intro token={token || null}></Intro>
                    </Route>

                   
                  </Switch>
                </Grid>
              </Grid>
            </div>
          </Router>
        </div>
      </Typography>
    </ThemeProvider>
  )
}

export default App