import numpy as np
import string
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

# set plot type (contour or imshow)
allowedtypes=['contour','imshow']
plottype='contour'
# plottype='imshow'
assert plottype in allowedtypes,'ERROR: INVALID PLOTTYPE [{}]'.format(plottype)

# define detectors
dets={'H':{'name':'Hanford','loc':[241,46]},
    'L':{'name':'Livingston','loc':[269,30]},
    'V':{'name':'Virgo','loc':[10,43]},
    'K':{'name':'KAGRA','loc':[137,36]}}

detvecs={}
detlist=[]
for d in dets:
    detlist.append(d)
    detvecs[d]=lb2vec(dets[d]['loc'][0],dets[d]['loc'][1])
    
# define grid
gridsize=[15,15]

# set grid for contour plot
nRA=int(360/gridsize[0])+1
nDec=int(180/gridsize[1])+1
gridRA=np.arange(0,360+gridsize[0],gridsize[0])
gridDec=np.arange(90,-90-gridsize[1],-gridsize[1])

# set grid for imshow plot
nRAim=int(360/gridsize[0])
nDecim=int(180/gridsize[1])
gridRAim=np.arange(gridsize[0]/2,360,gridsize[0])
gridDecim=np.arange(90-gridsize[1]/2,-90,-gridsize[1])

# Loop over detector pairs and calculate dt across RA/Dec grid
maps={}
p=1
for d1 in detlist:
    for d2 in detlist:
        if d1>d2:
            maps[d1+d2]={'fignum':p}
            p=p+1
            d1vec=lb2vec(dets[d1]['loc'][0],dets[d1]['loc'][1])
            d2vec=lb2vec(dets[d2]['loc'][0],dets[d2]['loc'][1])
            print('{}->{}:{}'.format(d1,d2,np.sqrt(np.dot(d2vec-d1vec,d2vec-d1vec))*const.R_earth.to('km')))
            
            if plottype=='contour':
                maps[d1+d2]['dt']=np.zeros([nDec,nRA])
                for r in range(nRA):
                    for d in range(nDec):
                        vec=lb2vec(gridRA[r],gridDec[d])
                        dt=(np.dot(vec,d2vec-d1vec))*const.R_earth/const.c
                        # if d1+d2=='LH':
                            # print(r,d,grid[r][d][d1+d2])
                        maps[d1+d2]['dt'][d,r]=dt.value*1000
            elif plottype=='imshow':
                maps[d1+d2]['dtim']=np.zeros([nDecim,nRAim])
                for r in range(nRAim):
                    for d in range(nDecim):
                        vec=lb2vec(gridRAim[r],gridDecim[d])
                        dtim=(np.dot(vec,d2vec-d1vec))*const.R_earth/const.c
                        # if d1+d2=='LH':
                            # print(r,d,grid[r][d][d1+d2])
                        maps[d1+d2]['dtim'][d,r]=dtim.value*1000
        
# IF PLOTTING USING CONTOUR PLOTS
if plottype=='contour':
    labgridsize=[15,15]
    labgridRA=np.arange(0,360+labgridsize[0],labgridsize[0])
    labgridDec=np.arange(-90,90+labgridsize[1],labgridsize[1])
    for dd in maps:    
        fig=plt.figure(maps[dd]['fignum'])
        plt.clf()
        plt.contourf(gridRA,gridDec,maps[dd]['dt'],levels=8)
        ax=plt.gca()
        ax.set_aspect('equal')
        plt.title('Time Difference: {}-{}'.format(dets[dd[0]]['name'],dets[dd[1]]['name']))
        
        # add ticks and labels
        ax.set_xticks(labgridRA,['']*len(labgridRA))
        ax.set_xticks(labgridRA[:-1]+labgridsize[0]/2,range(len(labgridRA)-1),minor=True)
        ax.set_yticks(labgridDec,['']*len(labgridDec))
        ax.set_yticks(labgridDec[:-1]+labgridsize[1]/2,string.ascii_uppercase[:len(labgridDec)-1],minor=True)
        ax.tick_params(axis='both',which='minor',length=0)

        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom')
        plt.savefig('plots/dt_contour_{}.png'.format(dd))
        
        # add letters for detectors
        # for det in dets:
        #     plt.annotate(det,(dets[det]['loc']),ha='center',va='center')

elif plottype=='imshow':
    dRAgrid=nRAim/24
    dDecgrid=nDecim/12
    for dd in maps:    
        fig=plt.figure(maps[dd]['fignum']+10)
        plt.clf()
        plt.imshow(maps[dd]['dtim'],aspect='equal')
        ax=plt.gca()
        ax.set_aspect('equal')
        
        # add ticks and labels
        plt.title('Time Difference: {}-{}'.format(dets[dd[0]]['name'],dets[dd[1]]['name']))
        ax.set_xticks(np.arange(0,nRAim,dRAgrid)-0.5,['']*24)
        ax.set_xticks(np.arange(np.max([0,(dRAgrid-1)/2]),nRAim,dRAgrid),range(24),minor=True)
        ax.set_yticks(np.arange(0,nDecim,dDecgrid)-0.5,['']*12)
        ax.set_yticks(np.arange(np.max([0,(dDecgrid-1)/2]),nDecim,dDecgrid),string.ascii_uppercase[:12],minor=True)
        ax.tick_params(axis='both',which='minor',length=0)
        
        ax.xaxis.set_ticks_position('bottom')
        ax.yaxis.set_ticks_position('left')
        ax.grid(axis='both',which='major',alpha=1)
        plt.colorbar(location='bottom')
        plt.savefig('plots/dt_imshow_{}.png'.format(dd))
        # ax.grid(axis='both',which='minor',alpha=0.5)
        
        
plt.show()