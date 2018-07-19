import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Page, Header, Content, stores, axios } from 'choerodon-front-boot';
import { Button, Spin, message, Icon } from 'choerodon-ui';
import _ from 'lodash';
import { DragDropContext } from 'react-beautiful-dnd';
import Version from '../BacklogComponent/VersionComponent/Version';
import Epic from '../BacklogComponent/EpicComponent/Epic';
import Sprint from '../BacklogComponent/SprintComponent/Sprint';
import IssueDetail from '../BacklogComponent/IssueDetailComponent/IssueDetail';
import './BacklogHome.scss';
import '../../../main.scss';
import BacklogStore from '../../../../stores/project/backlog/BacklogStore';
import ScrumBoardStore from '../../../../stores/project/scrumBoard/ScrumBoardStore';

const { AppState } = stores;

@observer
class BacklogHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      spinIf: false,
      versionVisible: false,
      epicVisible: false,
      scrollIf: false,
      more: false,
      expand: false,
    };
  }
  componentWillMount() {
    this.refresh();
  }
  componentDidMount() {
    const timer = setInterval(() => {
      if (document.getElementsByClassName('c7n-backlogTools-left').length > 0) {
        if (document.getElementsByClassName('c7n-backlogTools-left')[0].scrollHeight > document.getElementsByClassName('c7n-backlogTools-left')[0].clientHeight) {
          this.setState({
            more: true,
          });
        }
        clearInterval(timer);
      }
    }, 1000);
  }
  componentWillUnmount() {
    BacklogStore.clearSprintFilter();
    BacklogStore.setClickIssueDetail({});
  }
  //  拖动结束事件
  onDragEnd(result) {
    this.versionRef.changeState([]);
    this.epicRef.changeState([]);
    BacklogStore.setIsDragging(false);
    this.sprintRef.onChangeState('draggableId', '');
    if (!result.destination) {
      return;
    }
    const sourceId = result.source.droppableId;
    const endId = result.destination.droppableId;
    const endIndex = result.destination.index;
    const originData = JSON.parse(JSON.stringify(BacklogStore.getSprintData));
    const newData = JSON.parse(JSON.stringify(BacklogStore.getSprintData));
    if (String(endId).indexOf('epic') !== -1) {
      // 移动到epic
    } else if (String(endId).indexOf('version') !== -1) {
      // 移到version
    } else {
      // 移动到sprint
      this.dragToSprint(result, sourceId, endId, endIndex, originData, newData);
    }
  }
  getDestinationData(endId, endIndex, newData) {
    let destinationData = {};
    if (endId !== 'backlog') {
      _.forEach(newData.sprintData, (item, index) => {
        if (String(item.sprintId) === String(endId)) {
          if (newData.sprintData[index].issueSearchDTOList) {
            if (newData.sprintData[index].issueSearchDTOList.length > 0) {
              if (endIndex >= newData.sprintData[index].issueSearchDTOList.length) {
                destinationData = 
                  newData.sprintData[index].issueSearchDTOList[
                    newData.sprintData[index].issueSearchDTOList.length - 1];
              } else {
                destinationData = newData.sprintData[index].issueSearchDTOList[endIndex];
              }
            }
          }
        }
      });
    } else if (newData.backlogData.backLogIssue.length > 0) {
      if (endIndex >= newData.backlogData.backLogIssue.length) {
        destinationData = 
          newData.backlogData.backLogIssue[
            newData.backlogData.backLogIssue - 1];
      } else {
        destinationData = newData.backlogData.backLogIssue[endIndex];
      }
    }
    return destinationData;
  }
  getSprint() {
    BacklogStore.axiosGetSprint(BacklogStore.getSprintFilter()).then((data) => {
      BacklogStore.setSprintData(data);
      this.setState({
        spinIf: false,
      });
    }).catch((error2) => {
    });
  }
  dragToSprint(result, sourceId, endId, endIndex, originData, newData1) {
    const newData = _.clone(newData1);
    // 如果是多选
    if (this.sprintRef.getCurrentState('selected').issueIds.length > 0) {
      const destinationData = this.getDestinationData(endId, endIndex, newData);
      let spliceDatas = [];
      // 起始如果是sprint
      if (sourceId !== 'backlog') {
        _.forEach(newData.sprintData, (item, index) => {
          if (String(item.sprintId) === String(sourceId)) {
            spliceDatas = _.remove(newData.sprintData[index].issueSearchDTOList, 
              n => this.sprintRef.getCurrentState('selected').issueIds.indexOf(n.issueId) !== -1);
          }
        });
      } else {
        // 起始如果是backlog
        spliceDatas = _.remove(newData.backlogData.backLogIssue, 
          n => this.sprintRef.getCurrentState('selected').issueIds.indexOf(n.issueId) !== -1);
      }
      const axiosParam = {};
      // 如果移动到sprint
      if (endId !== 'backlog') {
        let afIndex;
        _.forEach(newData.sprintData, (item, index) => {
          if (String(item.sprintId) === String(endId)) {
            if (_.isNull(newData.sprintData[index].issueSearchDTOList)) {
              newData.sprintData[index].issueSearchDTOList = [];
            }
            if (endIndex !== 0) {
              _.forEach(newData.sprintData[index].issueSearchDTOList, (af, aindex) => {
                if (destinationData.issueId) {
                  if (af.issueId === destinationData.issueId) {
                    afIndex = aindex + 1;
                  }
                }
              });
              newData.sprintData[index].issueSearchDTOList.splice(afIndex, 0, spliceDatas);
              newData.sprintData[index].issueSearchDTOList = 
                _.flattenDeep(newData.sprintData[index].issueSearchDTOList);
            } else {
              newData.sprintData[index].issueSearchDTOList.splice(endIndex, 0, spliceDatas);
              newData.sprintData[index].issueSearchDTOList = 
                _.flattenDeep(newData.sprintData[index].issueSearchDTOList);
            }
            axiosParam.before = endIndex === 0;
            axiosParam.issueIds = this.sprintRef.getCurrentState('selected').issueIds;
            axiosParam.outsetIssueId = destinationData.issueId; 
            BacklogStore.setSprintData(newData);
          }
        });
      } else {
        // 如果移动到backlog
        if (_.isNull(newData.backlogData.backLogIssue)) {
          newData.backlogData.backLogIssue = [];
        }
        let afIndex;
        if (endIndex !== 0) {
          _.forEach(newData.backlogData.backLogIssue, (af, aindex) => {
            if (destinationData.issueId) {
              if (af.issueId === destinationData.issueId) {
                afIndex = aindex + 1;
              }
            }
          });
          newData.backlogData.backLogIssue.splice(afIndex, 0, spliceDatas);
          newData.backlogData.backLogIssue = _.flattenDeep(newData.backlogData.backLogIssue);
        } else {
          newData.backlogData.backLogIssue.splice(endIndex, 0, spliceDatas);
          newData.backlogData.backLogIssue = _.flattenDeep(newData.backlogData.backLogIssue);
        }
        axiosParam.before = endIndex === 0;
        axiosParam.issueIds = this.sprintRef.getCurrentState('selected').issueIds;
        axiosParam.outsetIssueId = 
              destinationData.issueId; 
        BacklogStore.setSprintData(newData);
      }
      this.sprintRef.onChangeState('selected', {
        droppableId: '',
        issueIds: [],
      });
      BacklogStore.axiosUpdateIssuesToSprint(endId === 'backlog' 
        ? 0 : endId, axiosParam).then((res) => {
        this.IssueDetail.refreshIssueDetail();
        this.getSprint();
      }).catch((error) => {
        BacklogStore.setSprintData(originData);
      });
    } else {
      // 如果不是多选
      const axiosParam = {};
      const sourceIndex = result.source.index;
      let spliceData = {};
      if (sourceId !== 'backlog') {
        _.forEach(newData.sprintData, (item, index) => {
          if (String(item.sprintId) === String(sourceId)) {
            spliceData = newData.sprintData[index].issueSearchDTOList.splice(sourceIndex, 1)[0];
          }
        });
      } else {
        spliceData = newData.backlogData.backLogIssue.splice(sourceIndex, 1)[0];
      }
      if (endId !== 'backlog') {
        _.forEach(newData.sprintData, (item, index) => {
          if (String(item.sprintId) === String(endId)) {
            if (_.isNull(newData.sprintData[index].issueSearchDTOList)) {
              newData.sprintData[index].issueSearchDTOList = [];
            }
            newData.sprintData[index].issueSearchDTOList.splice(endIndex, 0, spliceData);
            axiosParam.before = endIndex === 0;
            axiosParam.issueIds = [result.draggableId];
            if (endIndex === 0) {
              if (newData.sprintData[index].issueSearchDTOList.length === 1) {
                axiosParam.outsetIssueId = 0;
              } else {
                axiosParam.outsetIssueId = 
                newData.sprintData[index].issueSearchDTOList[endIndex + 1].issueId; 
              }
            } else {
              axiosParam.outsetIssueId = 
              newData.sprintData[index].issueSearchDTOList[endIndex - 1].issueId; 
            }
            BacklogStore.setSprintData(newData);
            BacklogStore.axiosUpdateIssuesToSprint(endId === 'backlog' 
              ? 0 : endId, axiosParam).then((res) => {
              // newData.sprintData[index].issueSearchDTOList[endIndex] = res[0];
              this.IssueDetail.refreshIssueDetail();
              // BacklogStore.setSprintData(newData);
              this.getSprint();
            }).catch((error) => {
              BacklogStore.setSprintData(originData);
            });
          }
        });
      } else {
        if (_.isNull(newData.backlogData.backLogIssue)) {
          newData.backlogData.backLogIssue = [];
        }
        newData.backlogData.backLogIssue.splice(endIndex, 0, spliceData);
        axiosParam.before = endIndex === 0;
        axiosParam.issueIds = [result.draggableId];
        if (endIndex === 0) {
          if (newData.backlogData.backLogIssue.length === 1) {
            axiosParam.outsetIssueId = 0;
          } else {
            axiosParam.outsetIssueId = 
            newData.backlogData.backLogIssue[endIndex + 1].issueId; 
          }
        } else {
          axiosParam.outsetIssueId = 
          newData.backlogData.backLogIssue[endIndex - 1].issueId; 
        }
        BacklogStore.setSprintData(newData);
        BacklogStore.axiosUpdateIssuesToSprint(endId === 'backlog' 
          ? 0 : endId, axiosParam).then((res) => {
          // newData.backlogData.backLogIssue[endIndex] = res[0];
          this.IssueDetail.refreshIssueDetail();
          // BacklogStore.setSprintData(newData);
          this.getSprint();
        }).catch((error) => {
          BacklogStore.setSprintData(originData);
        });
      }
    }
  }

  refresh() {
    this.setState({
      spinIf: true,
    });
    ScrumBoardStore.axiosGetQuickSearchList().then((res) => {
      ScrumBoardStore.setQuickSearchList(res);
      this.getSprint();
      BacklogStore.axiosGetVersion().then((data2) => {
        const newVersion = [...data2];
        _.forEach(newVersion, (item, index) => {
          newVersion[index].expand = false;
        });
        BacklogStore.setVersionData(newVersion);
      }).catch((error) => {
      });
      BacklogStore.axiosGetEpic().then((data3) => {
        const newEpic = [...data3];
        _.forEach(newEpic, (item, index) => {
          newEpic[index].expand = false;
        });
        BacklogStore.setEpicData(newEpic);
      }).catch((error3) => {
      });
    }).catch((error) => {
    });
  }
  changeState(state, value) {
    this.setState({
      [state]: value,
    });
  }
  handleCreateSprint() {
    this.setState({
      loading: true,
    });
    const data = {
      projectId: AppState.currentMenuType.id,
    };
    BacklogStore.axiosCreateSprint(data).then((res) => {
      this.setState({
        loading: false,
      });
      this.refresh();
      message.success('创建成功');
      if (document.getElementById('sprint_last')) {
        document.getElementsByClassName('c7n-backlog-sprint')[0].scrollTop = document.getElementById('sprint_last').offsetTop - 100;
      }
    }).catch((error) => {
      this.setState({
        loading: false,
      });
      message.success('创建失败');
    });
  }

  filterOnlyMe() {
    BacklogStore.setOnlyMe(!BacklogStore.getOnlyMe);
    BacklogStore.axiosGetSprint(BacklogStore.getSprintFilter()).then((res) => {
      BacklogStore.setSprintData(res);
    }).catch((error) => {
    });
  }

  filterOnlyStory() {
    BacklogStore.setRecent(!BacklogStore.getRecent);
    BacklogStore.axiosGetSprint(BacklogStore.getSprintFilter()).then((res) => {
      BacklogStore.setSprintData(res);
    }).catch((error) => {
    });
  }

  filterQuick(item) {
    const newState = [...BacklogStore.getQuickFilters];
    if (newState.indexOf(item.filterId) === -1) {
      newState.push(item.filterId);
    } else {
      newState.splice(newState.indexOf(item.filterId), 1);
    }
    BacklogStore.setQuickFilters(newState);
    this.refresh();
  }

  resetSprintChose() {
    this.sprintRef.resetMuilterChose();
  }
  
  render() {
    const that = this;
    return (
      <Page
        service={[
          'agile-service.product-version.createVersion',
          'agile-service.issue.deleteIssue',
          'agile-service.sprint.queryByProjectId',
        ]}
      >
        <Header title="待办事项">
          <Button className="leftBtn" functyp="flat" onClick={this.handleCreateSprint.bind(this)}>
            <Icon type="playlist_add" />创建冲刺
          </Button>
          <Button className="leftBtn2" functyp="flat" onClick={this.refresh.bind(this)}>
            <Icon type="refresh" />刷新
          </Button>
        </Header>
        <Content style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="c7n-backlogTools">
            <div
              className="c7n-backlogTools-left"
              style={{
                height: this.state.expand ? '' : 27,
              }}
            >
              <p style={{ marginRight: 32, whiteSpace: 'nowrap' }}>快速搜索:</p>
              <p
                className="c7n-backlog-filter"
                style={{
                  background: BacklogStore.getOnlyMe ? '#3F51B5' : '',
                  color: BacklogStore.getOnlyMe ? 'white' : '#3F51B5',
                }}
                role="none"
                onClick={this.filterOnlyMe.bind(this)}
              >仅我的问题</p>
              <p
                className="c7n-backlog-filter"
                style={{
                  background: BacklogStore.getRecent ? '#3F51B5' : '',
                  color: BacklogStore.getRecent ? 'white' : '#3F51B5',
                }}
                role="none"
                onClick={this.filterOnlyStory.bind(this)}
              >仅故事</p>
              {
                ScrumBoardStore.getQuickSearchList.length > 0 ?
                  ScrumBoardStore.getQuickSearchList.map(item => (
                    <p
                      className="c7n-backlog-filter"
                      style={{
                        background: BacklogStore.getQuickFilters.indexOf(item.filterId) !== -1 ? '#3F51B5' : '',
                        color: BacklogStore.getQuickFilters.indexOf(item.filterId) !== -1 ? 'white' : '#3F51B5',
                      }}
                      role="none"
                      onClick={this.filterQuick.bind(this, item)}
                    >
                      {item.name}
                    </p>
                  )) : ''
              }
            </div>
            <div
              style={{
                display: this.state.more ? 'block' : 'none',
                color: 'rgb(63, 81, 181)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              role="none"
              onClick={() => {
                this.setState({
                  expand: !this.state.expand,
                });
              }}
            >
              {this.state.expand ? '...收起' : '...展开'}
            </div>
          </div>
          <div className="c7n-backlog">
            <div className="c7n-backlog-side">
              {this.state.versionVisible ? '' : (
                <p
                  role="none"
                  onClick={() => {
                    this.setState({
                      versionVisible: true,
                    });
                  }}
                >版本</p>
              )}
              {this.state.epicVisible ? '' : (
                <p
                  style={{
                    marginTop: 12,
                  }}
                  role="none"
                  onClick={() => {
                    this.setState({
                      epicVisible: true,
                    });
                  }}
                >史诗</p>
              )}
            </div>
            <div className="c7n-backlog-content">
              <DragDropContext
                onDragEnd={this.onDragEnd.bind(this)}
                onDragStart={(result) => {
                  BacklogStore.setIsDragging(true);
                  this.sprintRef.onChangeState('draggableId', result.draggableId);
                  if (this.sprintRef.getCurrentState('selected').issueIds.indexOf(result.draggableId) === -1) {
                    this.sprintRef.onChangeState('selected', {
                      droppableId: '',
                      issueIds: [],
                    });
                  }
                  if (this.sprintRef.getCurrentState('selected').issueIds.length > 0) {
                    this.versionRef.changeState(this.sprintRef.getCurrentState('selected').issueIds);
                    this.epicRef.changeState(this.sprintRef.getCurrentState('selected').issueIds);
                  } else {
                    this.versionRef.changeState([result.draggableId]);
                    this.epicRef.changeState([result.draggableId]);
                  }
                }}
              >
                <div style={{ display: 'flex', flexGrow: 1 }}>
                  <Version
                    onRef={(ref) => {
                      this.versionRef = ref;
                    }}
                    refresh={this.refresh.bind(this)}
                    visible={this.state.versionVisible}
                    changeVisible={this.changeState.bind(this)}
                    issueRefresh={() => {
                      this.IssueDetail.refreshIssueDetail();
                    }}
                  />
                  <Epic
                    onRef={(ref) => {
                      this.epicRef = ref;
                    }}
                    refresh={this.refresh.bind(this)}
                    visible={this.state.epicVisible}
                    changeVisible={this.changeState.bind(this)}
                    issueRefresh={() => {
                      this.IssueDetail.refreshIssueDetail();
                    }}
                  />
                  <Sprint
                    onRef={(ref) => {
                      this.sprintRef = ref;
                    }}
                    refresh={this.refresh.bind(this)}
                    epicVisible={this.state.epicVisible}
                    versionVisible={this.state.versionVisible}
                    spinIf={this.state.spinIf}
                  />
                </div>
                <IssueDetail
                  visible={JSON.stringify(BacklogStore.getClickIssueDetail) !== '{}'}
                  refresh={this.refresh.bind(this)}
                  onRef={(ref) => {
                    this.IssueDetail = ref;
                  }}
                  cancelCallback={this.resetSprintChose.bind(this)}
                />
              </DragDropContext>
            </div>
          </div>
        </Content>
      </Page>
    );
  }
}

export default BacklogHome;

