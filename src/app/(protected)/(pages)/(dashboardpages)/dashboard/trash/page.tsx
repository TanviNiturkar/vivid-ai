import React from 'react'

import { getDeletedProjects } from '@/actions/project'
import NotFound from '@/components/global/notfound'
import Projects from '@/components/global/projects'
import DeleteAllButton from './_components/DeleteAllButton'


const Page = async () => {
    const deletedProjects = await getDeletedProjects()
    if(!deletedProjects.data) return <NotFound />
  return (
    <div className='flex flex-col gap-6 relative'>
        <div className='flex justify-between items-center'>
            <div className='flex flex-col items-start'>
                <h1 className='text-2xl font-semibold dark:text-primary backdrop-blur-lg'>
                    Trash
                </h1>
                <p className='text-base font-normal data:text-secondary'>
                    All your deleted Presentations
                </p>
            </div>
            </div>
            <DeleteAllButton Projects={deletedProjects.data} />
            {deletedProjects.data.length > 0 ? (
                <Projects projects={deletedProjects.data}/>
            ) : (
                <NotFound />
            )}
        
    </div>
  )
}

export default Page