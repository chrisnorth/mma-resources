import numpy as np
from astropy import units as u
from astropy import constants as const
from astropy.coordinates import SkyCoord
from matplotlib import pyplot as plt
plt.ion()

def d2r(d):
    # convert degree to radians
    return(d/180.*np.pi)
    
def lb2vec(lon,lat):
    # convert a lon,lat pair to a vector
    vec=np.array([np.cos(d2r(lon))*np.cos(d2r(lat)),
        np.sin(d2r(lon))*np.cos(d2r(lat)),
        np.sin(d2r(lat))])
    return vec
        
def rotate(lon,lat,ang):
    # create rotation matrix
    angrot=np.array([[1,0,0],[0,np.cos(d2r(ang)),-np.sin(d2r(ang))],[0,np.sin(d2r(ang)),np.cos(d2r(ang))]])
    lonrot=np.array([[np.cos(d2r(lon)),-np.sin(d2r(lon)),0],[np.sin(d2r(lon)),np.cos(d2r(lon)),0],[0,0,1]])
    latrot=np.array([[np.cos(d2r(-lat)),0,np.sin(d2r(-lat))],[0,1,0],[-np.sin(d2r(-lat)),0,np.cos(d2r(-lat))]])
    matrot=np.matmul(np.matmul(lonrot,latrot),angrot)
    return matrot

# define detectors
dets={'H':{'name':'Hanford','loc':[-119,46]},
    'L':{'name':'Livingston','loc':[-108,30]},
    'V':{'name':'Virgo','loc':[10,43]},
    'K':{'name':'KAGRA','loc':[137,36]}}

detvecs={}
detlist=[]
for d in dets:
    detlist.append(d)
    detvecs[d]=lb2vec(dets[d]['loc'][0],dets[d]['loc'][1])
    
# define grid
gridsize=[15,15]
nRA=int(360/gridsize[0])
nDec=int(180/gridsize[1])
gridRA=np.arange(0+gridsize[0]/2,360,gridsize[0])
gridDec=np.arange(90-gridsize[0]/2,-90,-gridsize[1])

# print(gridRA,gridDec)

# grid=[[{'radec':None}]*nDec]*nRA
# # print(grid)
# # asdfas
# for r in range(nRA):
#     for d in range(nDec):
#         # grid[int(r)][int(d)]=r+d
#         radec=[gridRA[r],gridDec[d]]
#         grid[r][d]={'radec':radec}
#         vec=lb2vec(radec[0],radec[1])
#         print(r,d,radec,'vec',vec)
#         # vec=np.matmul(rotate(radec[0],radec[1],0),lb2vec(0,0))
#         for d1 in detlist:
#             for d2 in detlist:
#                 if d1>d2:
#                     d1vec=lb2vec(dets[d1][0],dets[d1][1])
#                     d2vec=lb2vec(dets[d2][0],dets[d2][1])
#                     dt=(np.dot(vec,d1vec)-np.dot(vec,d2vec))*const.R_earth/const.c
#                     grid[r][d][d1+d2]=dt.value*1000
#                     if d1+d2=='LH':
#                         print('d1',d1,d1vec)
#                         print('d2',d2,d2vec)
#                         print('dt',dt)
maps={}
p=1
for d1 in detlist:
    for d2 in detlist:
        if d1>d2:
            maps[d1+d2]={'dt':np.zeros([nDec,nRA]),'fignum':p}
            p=p+1
            d1vec=lb2vec(dets[d1]['loc'][0],dets[d1]['loc'][1])
            d2vec=lb2vec(dets[d2]['loc'][0],dets[d2]['loc'][1])
            for r in range(nRA):
                for d in range(nDec):
                    vec=lb2vec(gridRA[r],gridDec[d])
                    dt=(np.dot(vec,d1vec)-np.dot(vec,d2vec))*const.R_earth/const.c
                    # if d1+d2=='LH':
                        # print(r,d,grid[r][d][d1+d2])
                    maps[d1+d2]['dt'][d,r]=dt.value*1000
                
for dd in maps:    
    fig=plt.figure(maps[dd]['fignum'])
    plt.clf()
    plt.contourf(maps[dd]['dt'],levels=32)
    ax=plt.gca()
    ax.set_aspect('equal')
    plt.title('Time Difference: {}-{}'.format(dets[dd[0]]['name'],dets[dd[1]]['name']))
    ax.set_xticks(np.arange(0,24))
    # ax.set_xticks(minor_ticks, minor=True)
    ax.set_yticks(np.arange(0,12))
    ax.xaxis.set_ticks_position('bottom')
    ax.yaxis.set_ticks_position('left')
    # ax.set_yticks(minor_ticks, minor=True)
    ax.grid(axis='both',which='major',alpha=1)
    plt.colorbar(location='bottom')
    plt.savefig('plots/dt_{}.png'.format(dd))
    # ax.grid(axis='both',which='minor',alpha=0.5)
    
plt.show()