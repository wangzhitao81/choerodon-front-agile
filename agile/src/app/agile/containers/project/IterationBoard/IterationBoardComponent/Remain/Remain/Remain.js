import React, { Component } from 'react';
import { axios, stores } from 'choerodon-front-boot';
import './Remain.scss';
import { Spin } from 'choerodon-ui';
import Progress from '../../../../../../components/Progress';

const { AppState } = stores;
class Remain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      sprintId: undefined,
      sprintInfo: {},
    };
  }

  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.sprintId !== this.props.sprintId) {
      const sprintId = nextProps.sprintId;
      this.setState({
        sprintId,
      });
      this.loadSprintInfo(sprintId,);
    }
  }

  loadSprintInfo(sprintId) {
    if (!sprintId) {
      this.setState({
        loading: false,
        sprintInfo: {},
      });
    } else {
      this.setState({ loading: true });
      const projectId = AppState.currentMenuType.id;
      axios.get(`/agile/v1/projects/${projectId}/iterative_worktable/sprint?sprintId=${sprintId}`)
        .then((res) => {
          this.setState({
            sprintInfo: res,
            loading: false,
          });
        });
    }
  }

  render() {
    const { sprintInfo, loading } = this.state;
    return (
      <div className="c7n-sprintDashboard-remainDay">
        {
         loading ? (
           <div className="c7n-loadWrap">
             <Spin />
           </div>
         ) : (
           <div className="wrap">
              <span className="word">剩余</span>
              <div className="progress">
                <Progress
                  percent={50}
                  title={sprintInfo.dayRemain < 0 ? 0 : sprintInfo.dayRemain}
                />
              </div>
              <span className="word">天</span>
           </div>
         )
       }
      </div>
    );
  }
}
export default Remain;
