'use client'
import usePromtStore from '@/store/usePromtStore'
import { AnimatePresence , motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import React from 'react'
import CreatePage from './CreatePage/CreatePage'
import CreateAI from './GenerateAI/CreativeAI'
import ScratchPage from './scratch/ScratchPage'

type Props = {}

const RenderPage = (props: Props) => {
    const router = useRouter()
    const {page , setPage} = usePromtStore()
    const handleBack = ()=> {
        setPage('create')
    }



    const handleSelectOption = (option:string)=> {
        if(option === 'template'){
            router.push('/templates')
        }
        else if(option === 'create-scratch'){
            setPage('create-scratch')
        }
        else {
            setPage('creative-ai')
        }
    }
    const renderStep = ()=>{
        switch(page){
            case 'create' :
                return <CreatePage onSelectOption={handleSelectOption}/>
            case 'create-scratch' :
                return <ScratchPage onBack={handleBack}/> 
            case 'creative-ai' :
                return<CreateAI onBack={handleBack}/> 
            default:
                return null
        }
    }
  return (
    <AnimatePresence mode='wait'>
        <motion.div key={page} initial={{opacity:0, x:20}}
        animate={{opacity:1,x:0}}
        exit={{opacity:0,x:-20}}
        transition={{duration:0.3}}>
            {renderStep()}

        </motion.div>

    </AnimatePresence>
  )
}

export default RenderPage