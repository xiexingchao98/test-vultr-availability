import React from 'react';
import {message, Typography} from 'antd';
import { Layout } from "antd";
import { Progress } from 'antd';
import { Checkbox, Form, Button, Card, Icon, Table } from 'antd';
import 'antd/dist/antd.css';
import ReactDOM from "react-dom";
import rp from "request-promise";
const { Title, Paragraph, Text } = Typography;
const { Header, Footer, Sider, Content } = Layout;
const CheckboxGroup = Checkbox.Group;

const server = {
  "Frankfurt, DE": "fra-de-ping.vultr.com",
  "Paris, France": "par-fr-ping.vultr.com",
  "Amsterdam, NL": "ams-nl-ping.vultr.com",
  "London, UK": "lon-gb-ping.vultr.com",
  "New York (NJ)": "nj-us-ping.vultr.com",
  "Singapore": "sgp-ping.vultr.com",
  "Toronto, Canada": "tor-ca-ping.vultr.com",
  "Chicago, Illinois": "il-us-ping.vultr.com",
  "Atlanta, Geor gia": "ga-us-ping.vultr.com",
  "Miami, Florida ": "fl-us-ping.vultr.com",
  "Tokyo, Japan": "hnd-jp-ping.vultr.com",
  "Dallas, Texas": "tx-us-ping.vultr.com",
  "Seattle, Washington ": "wa-us-ping.vultr.com",
  "Silicon Valley, California": "sjo-ca-us-ping.vultr.com",
  "Los Angeles, California": "lax-ca-us-ping.vultr.com",
  "Sydney, Australia": "syd-au-ping.vultr.com",
};

const resourcePath = '/assets/logo__on-dark.svg';

const plainOptions = Object.keys(server);
const protocolHttps = "https://";

const columns = [
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
  },
  {
    title: 'Average(ms)',
    dataIndex: 'avg',
    key: 'avg',
    sorter: (a ,b) => { return a.avg - b.avg },
  },
  {
    title: 'Max(ms)',
    dataIndex: 'max',
    key: 'max',
    sorter: (a ,b) => { return a.max - b.max },
  },
  {
    title: 'Min(ms)',
    dataIndex: 'min',
    key: 'min',
    sorter: (a ,b) => { return a.min - b.min },
  },
  {
    title: 'Loss(%)',
    dataIndex: 'loss',
    key: 'loss',
    sorter: (a ,b) => { return a.loss - b.loss },
  },
];

let testResult = {};
const testCount = 3;
let count = 0;
let total = 0;
let invalid = 0;

class App extends React.Component {
  state = {
    checkedList: plainOptions,
    indeterminate: false,
    checkAll: true,
    dataSource: [],
    loading: false,
    progressBarPercent: 0,
    progressBarStatus: 'normal',
  };

  onChange = checkedList => {
    this.setState({
      checkedList,
      indeterminate: checkedList.length && checkedList.length < plainOptions.length,
      checkAll: checkedList.length === plainOptions.length,
    })
  };

  onCheckAllChange = e => {
    this.setState({
      checkedList: e.target.checked ? plainOptions : [],
      indeterminate: false,
      checkAll: e.target.checked,
    })
  };

  test = async () => {
    count = 0;
    invalid = 0;
    this.setState({
      loading: true,
      progressBarPercent: 0,
      dataSource: [],
    });
    total = testCount * this.state.checkedList.length;
    for (let location of this.state.checkedList) {
      this.testServer(location).then();
    }
  };

  testServer = (location) => {
    return new Promise((resolve, reject) => {
      testResult[location] = [];
      for (let i = 0; i < testCount; ++i) {
        let a = async () => {
          return await rp({url: protocolHttps + server[location] + resourcePath + `?timestamp=${Date.now() + i}`, timeout: 2000, time: true, resolveWithFullResponse: true}).then( (res) => {
            testResult[location].push(res.timingPhases.firstByte);
            count++;
            this.setState({
              progressBarPercent: Math.round((count / total)*100),
            });
            if (count === total) {
              this.setState({
                progressBarPercent: 100,
              });
              this.doSummary(testResult);
              console.log(testResult)
            }
          }).catch(() => {
            invalid++;
            count++;
            if (count === total) {
              this.doSummary(testResult);
              console.log(testResult)
            }
          });
        };
        a();
      }
    });
  };

  doSummary(testResult) {
    let newDataSource = [];
    for (let location in testResult) {
      let data = testResult[location];
      let sum = 0;
      let max = data[0];
      let min = 9999;
      let invalid = 0;
      for (let delay of data) {
        if (delay === -1) {
          invalid++;
        } else {
          sum += delay;
          if (delay > max) {
            max = delay;
          } else if (delay < min) {
            min = delay;
          }
        }
      }
      let locationTestResult = {'location': location, 'max': max, 'min': min, 'avg': Math.round(sum / (data.length - invalid)), 'loss': (invalid / data.length) * 100, 'key': location};
      newDataSource.push(locationTestResult)
    }
    console.log(newDataSource);
    this.setState({
      dataSource: newDataSource,
    });
    this.setState({
      loading: false,
    });
    message.success('test successfully completed!')
  }

  render () {
    return (
      <div className="App">
        <Layout>
          <Header>
            <p style={{ color: 'white', 'fontSize': '20px' }}>Test vultr availability</p>
          </Header>
          <Content style={{'padding': '48px'}}>
            <Typography>
              <Title level={2}>Introduction</Title>
              <Paragraph>Take a quick test to know which servers of <Text style={{'font-size': '20px', 'font-weight': 'bold', 'margin': '0 6px'}}>Vultr</Text> are available in your area.</Paragraph>
            </Typography>
            <p style={{ 'margin': '24px 0', 'padding': '24px', 'background': 'white'}}>
              <Title level={3}>Select Location</Title>
              <p style={{'margin': '24px 0'}}>
                <Checkbox indeterminate={this.state.indeterminate} onChange={this.onCheckAllChange} checked={this.state.checkAll}>Select all</Checkbox>
              </p>
              <p style={{'margin': '24px 0'}}>
                <CheckboxGroup options={plainOptions} value={this.state.checkedList} onChange={this.onChange} />
              </p>
              <p style={{'margin': '24px 0'}}>
                <Button type='primary' icon='play-circle' block onClick={this.test} style={{'height': '48px', 'font-size': '24px'}}>Start test</Button>
              </p>
            </p>
            <p style={{ 'margin': '24px 0', 'padding': '24px', 'background': 'white'}}>
              <Title level={3}>Progress</Title>
              <Progress percent={this.state.progressBarPercent} status={this.state.progressBarStatus}/>
            </p>
            <Table columns={columns} dataSource={this.state.dataSource} loading={this.state.loading} style={{'margin': '24px 0', 'background': 'white'}}/>
          </Content>
        </Layout>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));