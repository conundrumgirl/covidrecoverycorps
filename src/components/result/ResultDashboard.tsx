import {
  Box,
  Button,
  CircularProgress,
  Container,
  makeStyles
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert/Alert'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import liResultIndeterminate from '../../assets/results/liResultIndeterminate.svg'
import liResultNegative from '../../assets/results/liResultNegative.svg'
import liResultNext from '../../assets/results/liResultNext.svg'
import liResultPositive from '../../assets/results/liResultPositive.svg'
import { SurveyService } from '../../services/survey.service'
import { UserService } from '../../services/user.service'
import {
  LoggedInUserData,
  SavedSurvey,

  TestResult,
  TestResultString
} from '../../types/types'
import LeftNav, { LeftNavItem } from '../static/LeftNav'
import TwoColumnTemplate from '../static/TwoColumnTemplate'
import ShareModal from '../widgets/ShareModal'
import MonthlySurvey from './MonthlySurvey'
import Result, { RESULT_COLOR } from './Result'

type ResultProps = {
  token: string
}

export const useStyles = makeStyles(theme => ({
  root: {
    maxWith: '1080',
  },

  loader: {
    textAlign: 'center',
    position: 'absolute',
    left: '50%',
  },
  newNotification: {
    position: 'absolute',
    top: '-.6rem',
    right: '-1rem',
    width: '2.2rem',
    height: '2.2rem',
    color: '#fff',
    textAlign: 'center',
    fontSize: '1.2rem',
    backgroundColor: '#FC9090',
    borderRadius: '50%',
    lineHeight: '2.2rem',
    fontWeight: 'bold',
  },
}))
export const ResultDashboard: React.FunctionComponent<ResultProps> = ({
  token,
}: ResultProps) => {
  const classes = useStyles()
  const [isShowingShareDialog, setIsShowingShareDialog] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState()
  const [userData, setUserData] = useState<LoggedInUserData | undefined>(
    undefined,
  )
  const [result, setResult] = useState<TestResult | undefined>()
  const [activeItemIndex, setActiveItemIndex] = useState(0)
 
  const [latestMonthlySurvey, setLatestMonthlySurvey] = useState<{
    survey?: SavedSurvey
    isCompleted: boolean
  }>({ isCompleted: true })
  const { t } = useTranslation()

  const setMonthlySurvey = async (token: string) => {
    if (token) {
      setIsLoading(true)
      try {
        const monthlySurvey = await SurveyService.getLatestMonthlySurvey(token)
        setLatestMonthlySurvey(monthlySurvey)
      } catch (e) {
        setError(e)
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    let isSubscribed = true
    const getInfo = async () => {
      if (token) {
        setIsLoading(true)
        try {
          const userInfoResponse = await UserService.getUserInfo(token)
          const ResultsResponse = await UserService.getTestResult(token)
          if (isSubscribed) {
            await setMonthlySurvey(token)
            setUserData(userInfoResponse.data)
            if (ResultsResponse?.data?.items?.length > 0) {
              const result = ResultsResponse.data.items[0]
              setResult(result)
            }
          }
        } catch (e) {
          if (isSubscribed) {
            setError(e)
          }
        } finally {
          if (isSubscribed) {
            setIsLoading(false)
          }
        }
      }
    }
    getInfo()
    return () => {
      isSubscribed = false
    }
  }, [token])

  const triggerToggle = () => {
    setMonthlySurvey(token)
  }

  const getNav = (activeIndex: number): JSX.Element => {
    if (!result) {
      return <></>
    }
    const resultValue = result.data.valueString.toUpperCase() as TestResultString

    const navItems: LeftNavItem[] = [
      {
        img: liResultNegative,
        text: t('resultDashboard.li1'),
        callbackFn: () => setActiveItemIndex(0),
      },
    ]
    if (resultValue === 'INDETERMINATE') {
      navItems[0].img = liResultIndeterminate
    }

    if (resultValue === 'POSITIVE') {
      navItems[0].img = liResultPositive
      if (!latestMonthlySurvey.isCompleted) {
        let img = <img src={liResultNext}></img>

        img = (
          <div style={{ position: 'relative' }}>
            {img}
            <div className={classes.newNotification}>1</div>
          </div>
        )

        navItems.push({
          element: img,
          text: t('resultDashboard.li2'),
          callbackFn: () => setActiveItemIndex(1),
        })
      }
    }

    return (
      <div className="no-print">
        <LeftNav
          items={navItems}
          activeColor={RESULT_COLOR[resultValue]}
          activeIndex={activeIndex}
          changeIndexCallbackFn={setActiveItemIndex}
        />
        <ShareModal
          show={isShowingShareDialog}
          onClose={() => {
            setIsShowingShareDialog(false)
          }}
        ></ShareModal>
        <div className="text-center">
          <Button
            style={{ margin: '30px auto 0 auto', fontSize: '14px' }}
            variant="outlined"
            color="primary"
            onClick={() => {
              setIsShowingShareDialog(true)
            }}
          >
            {' '}
            {t('resultDashboard.inviteCTA')}
          </Button>
        </div>
      </div>
    )
  }

  const getMain = (): JSX.Element => {
    if (error) {
      return <Alert severity="error">{error!['message'] || error}</Alert>
    }

    console.log(userData, activeItemIndex)
    if (userData) {
      return !activeItemIndex && result ? (
        <Result
          userData={userData!}
          testResult={result}
          changeTabCallbackFn={setActiveItemIndex}
        />
      ) : (
        <MonthlySurvey
          token={token}
          savedMonthlySurvey={latestMonthlySurvey.survey}
          onSurveyFinishedFn={triggerToggle}
        ></MonthlySurvey>
      )
    }

    return (
      <div className={classes.loader}>
        <CircularProgress color="primary" />
      </div>
    )
  }
  if (isLoading) {
    return (
      <Box width="100%" mx="auto" textAlign="center">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <div className={classes.root} data-cy="page-result">
      {result && (
        <TwoColumnTemplate
          nav={getNav(activeItemIndex)}
          main={getMain()}
        ></TwoColumnTemplate>
      )}

      {!(result || isLoading) && (
        <Container maxWidth="xs">
          <MonthlySurvey
            token={token}
            savedMonthlySurvey={latestMonthlySurvey.survey}
            onSurveyFinishedFn={triggerToggle}
          ></MonthlySurvey>
        </Container>
      )}
    </div>
  )
}

export default ResultDashboard
