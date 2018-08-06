# -*- coding:utf-8 -*-

import requests
import os

def getManyPages(keyword, start = 1, pages= 10):
    params=[]
    for i in range(start * 30, 30 * (pages + start), 30):
        params.append({
                      'tn': 'resultjson_com',
                      'ipn': 'rj',
                      'ct': 201326592,
                      'is': '',
                      'fp': 'result',
                      'queryWord': keyword,
                      'cl': 2,
                      'lm': -1,
                      'ie': 'utf-8',
                      'oe': 'utf-8',
                      'adpicid': '',
                      'st': -1,
                      'z': '',
                      'ic': 0,
                      'word': keyword,
                      's': '',
                      'se': '',
                      'tab': '',
                      'width': '',
                      'height': '',
                      'face': 0,
                      'istype': 2,
                      'qc': '',
                      'nc': 1,
                      'fr': '',
                      'pn': i,
                      'rn': 30,
                      'gsm': '1e',
                      '1488942260214': ''
                  })
    url = 'https://image.baidu.com/search/acjson'
    urls = []
    for i in params:
        try:
            urls.append(requests.get(url, params=i, timeout=15).json().get('data'))
        except Exception:
            print i['pn'],"failed!"

    return urls

def getImg(dataList, localPath):

    if not os.path.exists(localPath):  # 新建文件夹
        os.mkdir(localPath)

    x = 0
    for list in dataList:
        for i in list:
            if i.get("replaceUrl") != None:
                print('downloading: %s' % i.get("replaceUrl")[-1].get("ObjURL"))
                try:
                    ir = requests.get(i.get("replaceUrl")[-1].get("ObjURL"), timeout=15)
                    headers = ir.headers.keys()
                    if "Content-Type" in headers and "Content-Length" in headers:
                        if "image/" in ir.headers["Content-Type"] and ir.headers["Content-Length"] > 10000:
                            # print ir.headers["Content-Type"], ir.headers["Content-Length"]
                            open(localPath + '%d.jpg' % x, 'wb').write(ir.content)
                            x += 1
                except Exception:
                    print "time out!"
            else:
                print('img not found!')

if __name__ == '__main__':
    word =  raw_input("请输入你要下载的图片关键词：\n")
    dataList = getManyPages(word, 1, 2)  # 参数1:关键字，参数2:要下载的页数
    getImg(dataList, word + '/') # 参数2:指定保存的路径
    # print dataList


