import urllib
import urllib2
import os
from os import listdir, getcwd
from os.path import join
from random import random
from time import sleep
import cv2 as cv
from PIL import Image
import config
from bbox import bbox

txtName = 'origin_label_string'

wd = '/home/mboss/Documents/darknet/barcode'
sets = 'barcode'
cwd = join(wd, sets)

if not os.path.exists(join(wd, sets)):
    os.makedirs(join(wd, sets))

def gif2jpg(file):
    try:
        img = Image.open(file)
        img = img.convert('RGB')
        imgPath = file.replace('.gif', '.jpg')
        img.save(imgPath, 'jpeg')
        os.remove(file)
    except Exception as e:
        print e

def png2jpg(file):
    try:
        img = Image.open(file)
        img = img.convert('RGB')
        imgPath = file.replace('.png', '.jpg')
        img.save(imgPath, 'jpeg')
        os.remove(file)
    except Exception as e:
        print e

def download(url):
    # sleep(2)
    try:
        header = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',
            'Cookie': 'AspxAutoDetectCookieSupport=1'
        }
        req = urllib2.Request(url = url, headers=header)
        binary_data = urllib2.urlopen(req).read()
        imgName = url[url.rfind('/')+1:]
        imgPath = join(wd, sets,'images', imgName)
        
        gif = False
        png = False
        if ord(binary_data[0]) == 0x89 and ord(binary_data[1]) == 0x50: # png
            imgPath = imgPath.replace('.jpg', '.png')
            png = True
        if ord(binary_data[0]) == 0x47 and ord(binary_data[1]) == 0x49: # gif
            imgPath = imgPath.replace('.jpg', '.gif')
            gif = True
        # if ord(binary_data[0]) != 0xff and ord(binary_data[1]) != 0xd8: # not jpg
        #     print '%x %x'% (ord(binary_data[0]), ord(binary_data[1]))
        with open(imgPath, 'wb') as temp_file:
            temp_file.write(binary_data)
        
        if gif:
            gif2jpg(imgPath)
        if png:
            png2jpg(imgPath)
        # img = cv.imread(imgPath)
        # if img is None:
        #     print imgPath
        #     newPath = imgPath.replace('.jpg', '.png')
        #     os.rename(imgPath, newPath)
        #     img = cv.imread(newPath)
        #     if img is None:
        #         newPath_ = imgPath.replace('.jpg', '.gif')
        #         os.rename(newPath, newPath_)
        #         img = cv.imread(newPath_)
        #         if img is None:
        #             print '%s is invalid'%imgPath
        #         else:
        #             os.remove(newPath_)
        #             cv.imwrite(imgPath, img)
        #     else:
        #         os.remove(newPath)
        # else:
        #     # print img.header
        #     pass
        # temp_file.close()
        # urllib.urlretrieve(url, filename=join(wd, sets,'images', imgName))
        return True
    except Exception as e:
        print "error found",e
        return False

def generate():

    if not os.path.exists(join(wd, sets,'images')):
        # os.rmdir(join(wd, sets,'images'))
        os.makedirs(join(wd, sets,'images'))
    if not os.path.exists(join(wd, sets,'labels')):
        # os.rmdir(join(wd, sets,'labels'))
        os.makedirs(join(wd, sets,'labels'))

    origin_labels = open(join(wd, '%s.txt'%(txtName))).read().strip().split('\n')
    if os.path.exists(join(cwd, 'train.txt')):
        os.remove(join(cwd,'train.txt'))
    train_txt = open(join(cwd,'train.txt'), 'a')
    if os.path.exists(join(cwd, 'valid.txt')):
        os.remove(join(cwd,'valid.txt'))
    valid_txt = open(join(cwd,'valid.txt'), 'a')
    for line in origin_labels[1:]:
        line = line.split(' ')
        if len(line) < 1:
            continue
        if download(line[0]):
            imgName = line[0][line[0].rfind('/')+1:line[0].rfind('.')]
            labelString = ''
            for label in line[1:]:
                label = label.split(',')
                labelString += ' '.join(label[0:-1])
                labelString += '\n'
            open(join(wd, sets,'labels/%s.txt'%(imgName)), 'w').write(labelString)
            if random() > 0.9:
                valid_txt.write(join(wd, sets,'images/%s'%(line[0][line[0].rfind('/')+1:])) + '\n')
            else:
                train_txt.write(join(wd, sets,'images/%s'%(line[0][line[0].rfind('/')+1:])) + '\n')
                # print join(wd, sets,'images/%s'%(line[0][line[0].rfind('/')+1:]))

    train_txt.close()
    valid_txt.close()

def check():
    images = listdir(join(wd, sets,'images'))
    labels = listdir(join(wd, sets,'labels'))
    train_txt = open(join(cwd, 'train.txt'),'r').read().strip().split('\n')
    valid_txt = open(join(cwd, 'valid.txt'),'r').read().strip().split('\n')

    if len(images) != len(labels):
        print 'count not match: images is %d, label is %d'%(len(images),len(labels))
        return False
    else:
        print 'here is %d samples'%(len(images))
    
    for image in images[:]:
        name = image[:image.rfind('.')]
        if (name + '.txt') not in labels:
            print '%s.jpg is not match %s.txt'%(name,name)
    for train in train_txt:
        if not os.path.exists(train):
            print '%s is not found'%(train)
    for valid in valid_txt:
        if not os.path.exists(valid):
            print '%s is not found'%(valid)
    # train_txt.close()
    # valid_txt.close()

def geConfig(classes, trainPath, validPath, namesPath, batchs):
    dataString = config.data(classes, trainPath, validPath, namesPath)
    open(join(wd, sets, 'voc.data'), 'w').write(dataString)
    cfgString = config.cfg(classes, batchs)
    open(join(wd, sets, 'voc.cfg'), 'w').write(cfgString)

generate()
check()
# geConfig(1, join(cwd, 'train.txt'), join(cwd, 'valid.txt'), join(cwd, 'names.txt'), 4000)
# bbox(join(cwd, 'train.txt'))

# print './darknet detector train %s %s darknet53.conv.74'%(join(cwd, 'voc.data'), join(cwd, 'voc.cfg'))