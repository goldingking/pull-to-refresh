/**
 * @author springnap@163.com
 */

"use strict";

import {render} from 'react-dom'
import React, {Component} from 'react'
import styles from './pullload.less'
import PropTypes from 'prop-types';
import Spinner from './spin.min.js';

export let STAT = {
  refreshing: "refreshing",
  autoRefreshing: "autoRefreshing",
  init: "init",
  loadingMore: "loadingMore"
}

class PullLoad extends Component {

  constructor() {
    super();
    this.touchListener = this.touch.bind(this);
    this.initX = 0;
    this.initY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.totalDeltaY = 0;
    this.titleHeight = 0;
    this.arrowChanged = false;
    this.action = STAT.init;
    this.spinner = [];
    this.state = {
      pullState: 'init',
      lastScrollTop: 0
    }
  }

  componentDidMount() {
    this.refs.container.addEventListener("touchstart", this.touchListener);
    this.refs.container.addEventListener("touchmove", this.touchListener);
    this.refs.container.addEventListener("touchend", this.touchListener);
    this.refs.wrapper.addEventListener("scroll", this.touchListener);
    this.titleHeight = this.refs.title.clientHeight;
    this.refs.container.style.transform = `translateY(-${this.titleHeight}px)`;
    this.refs.container.style.webkitTransform = this.refs.container.style.transform;
    this.refs.wrapper.scrollTop = this.state.lastScrollTop;
  }

  componentWillUnmount(){
    this.refs.container.removeEventListener("touchstart", this.touchListener);
    this.refs.container.removeEventListener("touchmove", this.touchListener);
    this.refs.container.removeEventListener("touchend", this.touchListener);
    this.refs.wrapper.removeEventListener("scroll", this.touchListener);

    // 跳转到详情页的时候保存列表的当前位置
    if (this.refs.wrapper.scrollTop > 0) {
      // this.props.dispatch({type: 'pullState/recordPosition', payload: this.refs.wrapper.scrollTop});
      this.setState({lastScrollTop: this.refs.wrapper.scrollTop});
    }
  }

  componentWillReceiveProps(nextProps) {
    this.action = nextProps.action;
    if (STAT.init === this.action) {
      this.reset();
    }

    if (STAT.autoRefreshing === this.action) {
      this.autoRefresh();
    }
  }

  // 自动刷新
  autoRefresh() {
    this.refs.wrapper.scrollTop = 0;

    this.totalDeltaY = 2 * this.titleHeight;
    this.refs.container.style.transition = "all 0.5s";
    this.refs.container.style.webkitTransition = this.refs.container.style.transition;
    this.refs.container.style.transform = `translateY(${this.totalDeltaY - this.titleHeight}px)`;
    this.refs.container.style.webkitTransform = this.refs.container.style.transform;

    this.refs.arrow.style.transform = "rotate(180deg)";
    this.refs.arrow.style.webkitTransform = this.refs.arrow.style.transform;
    this.refs.arrow.style.transition = "all 0.5s";
    this.refs.arrow.style.webkitTransition = this.refs.arrow.style.transition;

    this.arrowChanged = true;

    this.action = STAT.autoRefreshing;
    this.setLoading();

    this.props.handleAction(STAT.autoRefreshing);
    this.showSpinner();
  }

  touch(event) {
    switch (event.type) {
      case "touchstart":
        this.initX = event.touches[0].screenX;
        this.initY = event.touches[0].screenY;
        break;
      case "touchmove":
        this.deltaX = event.touches[0].screenX - this.initX;
        this.deltaY = event.touches[0].screenY - this.initY;

        if (this.deltaY < 0) {
          this.totalDeltaY += this.deltaY;
        }

        // 在顶部进行下拉操作, 只能下拉一定距离
        if (this.deltaY > 0 && this.totalDeltaY < 2 * this.titleHeight && this.refs.wrapper.scrollTop === 0) {
          this.totalDeltaY += this.deltaY;
          // 下拉距离超过一定距离后触发箭头翻转和状态改变为正在刷新
          if (this.totalDeltaY >= this.titleHeight && this.arrowChanged == false) {
            this.refs.arrow.style.transform = "rotate(180deg)";
            this.refs.arrow.style.webkitTransform = this.refs.arrow.style.transform;
            this.refs.arrow.style.transition = "all 0.5s";
            this.refs.arrow.style.webkitTransition = this.refs.arrow.style.transition;
            this.arrowChanged = true;

            this.action = STAT.refreshing;
            this.setLoading();
          }

          this.refs.container.style.transition = "";
          this.refs.container.style.webkitTransition = this.refs.container.style.transition;
          this.refs.container.style.transform = `translateY(${this.totalDeltaY - this.titleHeight}px)`;
          this.refs.container.style.webkitTransform = this.refs.container.style.transform;

          event.preventDefault();
          event.stopPropagation();
        }

        // 当下拉数据缩回时, 箭头恢复到下拉刷新的状态
        if (this.arrowChanged == true && this.deltaY < 0) {
          this.refs.arrow.style.transform = "rotate(0deg)";
          this.refs.arrow.style.webkitTransform = this.refs.arrow.style.transform;
          this.refs.arrow.style.transition = "all 0.5s";
          this.refs.arrow.style.webkitTransition = this.refs.arrow.style.transition;
          this.arrowChanged = false;
          this.action = STAT.init;
        }

        this.initX = event.touches[0].screenX;
        this.initY = event.touches[0].screenY;

        break;
      case "touchend":
        if (STAT.refreshing === this.action) {
          // 触发刷新事件
          this.props.handleAction(STAT.refreshing);
          this.showSpinner();

        } else if (STAT.init === this.action) {
          this.reset();
        }
        break;
      case "scroll":
        if (this.refs.wrapper.scrollTop == 0) {
          event.preventDefault();
          event.stopPropagation();
        }

        let listDom = this.refs.wrapper;
        // console.log('scrollTop:' + listDom.scrollTop + ', clientHeight:' + listDom.clientHeight + ', scrollHeight:' + listDom.scrollHeight);
        // TODO 由于header向上translate了titleHeight的距离, 所以底部空白过大
        if (listDom.scrollHeight <= listDom.scrollTop + listDom.clientHeight + this.titleHeight) {
          this.props.handleAction(STAT.loadingMore);
          event.preventDefault();
          event.stopPropagation();
        }

        break;
    }
  }

  showSpinner() {
    // 先屏蔽箭头的显示
    this.refs.arrow.style.backgroundImage = "none";
    var opts = {
      lines: 13 // The number of lines to draw
      , length: 10 // The length of each line
      , width: 4 // The line thickness
      , radius: 12 // The radius of the inner circle
      , scale: 1 // Scales overall size of the spinner
      , corners: 1 // Corner roundness (0..1)
      , color: '#000' // #rgb or #rrggbb or array of colors
      , opacity: 0.25 // Opacity of the lines
      , rotate: 0 // The rotation offset
      , direction: 1 // 1: clockwise, -1: counterclockwise
      , speed: 1 // Rounds per second
      , trail: 60 // Afterglow percentage
      , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
      , zIndex: 2e9 // The z-index (defaults to 2000000000)
      , className: 'spinner' // The CSS class to assign to the spinner
      , top: '50%' // Top position relative to parent
      , left: '50%' // Left position relative to parent
      , shadow: false // Whether to render a shadow
      , hwaccel: false // Whether to use hardware acceleration
      , position: 'absolute' // Element positioning
    }
    var target = this.refs.arrow;
    this.spinner.push(new Spinner(opts).spin(target));
  }

  dismissSpinner() {
    if(this.spinner) {
      this.spinner.forEach(function(item){
          item.stop();
      });
    }
  }

  reset() {
    this.dismissSpinner();

    // 显示箭头
    this.refs.arrow.style.backgroundImage = 'url(' + require('../pullLoad/arrowDown.png') + ')';

    this.refs.container.style.transform = `translateY(${-this.titleHeight}px)`;
    this.refs.container.style.webkitTransform = this.refs.container.style.transform;
    this.refs.container.style.transition = "all 0.5s";
    this.refs.container.style.webkitTransition = this.refs.container.style.transition;
    if (this.arrowChanged) {
      this.refs.arrow.style.transform = "rotate(0deg)";
      this.refs.arrow.style.webkitTransform = this.refs.arrow.style.transform;
      this.refs.arrow.style.transition = "all 0.5s";
      this.refs.arrow.style.webkitTransition = this.refs.arrow.style.transition;
      this.arrowChanged = false;
    }

    this.totalDeltaY = 0;
    this.resetLoading();
  }

  render() {
    return (
      <div className={styles.wrapper} ref="wrapper">
        <div ref="container">
          <div className={styles.title} ref="title">
            <div ref="arrow"></div>
            <div ref="loadingText">下拉刷新</div>
          </div>
          <div className={styles.pullWrap}>
            {this.props.children}
          </div>
        </div>
      </div>
    )
  }

  setLoading() {
    this.refs.loadingText.innerHTML = "正在刷新...";
  }

  resetLoading() {
    this.refs.loadingText.innerHTML = "下拉刷新";
  }

}

PullLoad.propTypes = {
  handleAction: PropTypes.func.isRequired,
  action: PropTypes.string.isRequired
}

export default PullLoad;
