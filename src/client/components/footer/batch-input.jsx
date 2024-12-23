/**
 * batch input module
 */

import { Component } from 'react'
import {
  AutoComplete,
  Input
} from 'antd'
import {
  batchInputLsKey,
  commonActions,
  terminalWebType,
  terminalRdpType,
  terminalVncType
} from '../../common/constants'
import TabSelect from './tab-select'
import postMsg from '../../common/post-msg'
import classNames from 'classnames'

const e = window.translate

export default class BatchInput extends Component {
  constructor (props) {
    super(props)
    this.state = {
      cmd: '',
      selectedTabIds: [props.currentTabId],
      open: false,
      enter: false
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.currentTabId !== this.props.currentTabId) {
      this.setState(prevState => {
        const newSelectedTabIds = prevState.selectedTabIds.filter(
          id => id !== this.props.currentTabId
        )
        newSelectedTabIds.unshift(this.props.currentTabId)
        return {
          selectedTabIds: newSelectedTabIds
        }
      })
    }
  }

  componentWillUnmount () {
    clearTimeout(this.timer)
  }

  handleEnter = (e) => {
    const { cmd, selectedTabIds } = this.state
    if (!cmd.trim()) {
      return
    }
    window.store.addBatchInput(cmd)
    this.props.input(cmd, selectedTabIds)
    this.setState({
      cmd: '',
      open: false
    })
    e.stopPropagation()
  }

  onSelectAll = () => {
    this.setState({
      selectedTabIds: this.getTabs().map(tab => tab.id)
    })
  }

  onSelectNone = () => {
    this.setState({
      selectedTabIds: [this.props.currentTabId]
    })
  }

  filterValidTabIds = (tabIds) => {
    return tabIds.filter(id => {
      return this.props.tabs.some(tab => tab.id === id)
    })
  }

  onSelect = (id) => {
    this.setState(prevState => {
      const selectedTabIds = prevState.selectedTabIds.includes(id)
        ? prevState.selectedTabIds.filter(tabId => tabId !== id)
        : [...prevState.selectedTabIds, id]

      // Ensure at least the current tab is selected
      if (selectedTabIds.length === 0) {
        return {
          selectedTabIds: [this.props.currentTabId]
        }
      }

      return {
        selectedTabIds
      }
    })
  }

  handleChange = (v = '') => {
    let vv = v.replace(/^\d+:/, '').replace(/\n$/, '')
    if (vv === batchInputLsKey) {
      postMsg({
        action: commonActions.updateStore,
        func: 'clearBatchInput'
      })
      vv = ''
    }
    this.setState({
      cmd: vv,
      open: false
    })
  }

  handleClick = () => {
    this.setState({
      open: true,
      selectedTabIds: this.filterValidTabIds(this.state.selectedTabIds)
    })
  }

  handleChangeAll = toAll => {
    this.setState({
      toAll
    })
  }

  handleBlur = () => {
    this.setState({
      open: false
    })
  }

  mapper = (v, i) => {
    return {
      value: `${i}:${v}`,
      label: v
    }
  }

  renderClear = () => {
    return {
      value: batchInputLsKey,
      label: e('clear')
    }
  }

  buildOptions = () => {
    const arr = this.props.batchInputs.map(this.mapper)
    if (arr.length) {
      return [
        ...arr,
        this.renderClear()
      ]
    }
    return []
  }

  handleMouseEnter = () => {
    clearTimeout(this.timer)
    this.setState({
      enter: true
    })
  }

  leave = () => {
    this.setState({
      enter: false
    })
  }

  handleMouseLeave = () => {
    this.timer = setTimeout(this.leave, 5000)
  }

  getTabs = () => {
    const { currentTabId } = this.props
    return this.props.tabs.filter(tab => {
      return tab.type !== terminalWebType &&
        tab.type !== terminalRdpType &&
        tab.type !== terminalVncType
    }).sort((a, b) => {
      // Current tab goes first
      if (a.id === currentTabId) return -1
      if (b.id === currentTabId) return 1
      return 0
    })
  }

  render () {
    const { cmd, open, selectedTabIds, enter } = this.state
    const opts = {
      options: this.buildOptions(),
      placeholder: e('batchInput'),
      value: cmd,
      onChange: this.handleChange,
      defaultOpen: false,
      open,
      allowClear: true,
      className: 'batch-input-wrap'
    }
    const cls = classNames(
      'batch-input-outer',
      {
        'bi-show': open || enter
      }
    )
    const inputProps = {
      size: 'small',
      placeholder: e('batchInput'),
      className: 'batch-input-holder'
    }
    const tabSelectProps = {
      currentTabId: this.props.currentTabId,
      tabs: this.getTabs(),
      selectedTabIds,
      onSelectAll: this.onSelectAll,
      onSelectNone: this.onSelectNone,
      onSelect: this.onSelect
    }
    return (
      <span
        className={cls}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <span className='bi-compact'>
          <Input
            {...inputProps}
          />
        </span>
        <span className='bi-full'>
          <AutoComplete
            {...opts}
          >
            <Input.TextArea
              onPressEnter={this.handleEnter}
              onClick={this.handleClick}
              onBlur={this.handleBlur}
              size='small'
              autoSize={{ minRows: 1 }}
            />
          </AutoComplete>
          <TabSelect {...tabSelectProps} />
        </span>
      </span>
    )
  }
}
