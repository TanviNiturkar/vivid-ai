'use client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import {motion} from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Loader2, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import useCreativeAIStore from '@/store/useCreativeAIStore'
import { Select, SelectContent,SelectItem,SelectTrigger, SelectValue } from '@/components/ui/select'
import CardList from '../common/CardList'
import usePromtStore from '@/store/usePromtStore'
import RecentPrompts from './RecentPrompt'
import { toast } from 'sonner'
import { generateCreativePrompt } from '@/actions/chatgpt'
import { OutlineCard } from '@/lib/types'
import { v4 as uuid, v4 } from 'uuid'
import { createProject } from '@/actions/project'
import { useSlideStore } from '@/store/useSlideStore'


type Props = {
    onBack : ()=> void 
}

const CreateAI = ({onBack}: Props) => {
    const router = useRouter()
    const {setProject} = useSlideStore()
    const [editingCard,setEditingCard] = useState<string | null>(null)
    const [isGenerating , setIsGenerating] = useState(false)
    const [editText , setEditText] =useState('')
    const [selectedCard , setSelectedCard] = useState<string | null>(null)
    const {currentAiPrompt,setCurrentAiPrompt,outlines ,resetOutlines ,addOutline ,addMultipleOutlines} = useCreativeAIStore()
    const [noOfCards,setNoOfCards] = useState(0)
    const {prompts , addPrompt} = usePromtStore()
    const handleBack = () => {
        onBack()
    }
    const resetCards =()=>{
        setEditingCard(null)
        setSelectedCard(null)
        setEditText('')
        setCurrentAiPrompt('')
        resetOutlines()
    } 

    const generateOutline = async() =>{
        if(currentAiPrompt === ''){
            toast.error('Error', {
                description : 'Please enter a prompt to  generate an outline.',
            })
            return 
        }
            
                setIsGenerating(true)
                const res = await generateCreativePrompt( { prompt: currentAiPrompt, count: noOfCards })
                if(res.status === 200 && res?.data?.outlines){
                    const cardsData:OutlineCard[]=[]
                    res.data?.outlines.map((outline : string,idx:number)=>{
                        const newCard = {
                            id:v4(),
                            title:outline ,
                            order:idx+1,
                        }
                        cardsData.push(newCard)
                    })
                    addMultipleOutlines(cardsData)
                    setNoOfCards(cardsData.length)

                    toast.success('Success',{
                        description:'Outlines generated successfully',
                    })
                    
                }
                else {
                    toast.error('Error',{
                        description:'Failed to generate outline. Please try again .'
                    })
                }
                setIsGenerating(false)
    
        }


    const handleGenerate = async () => {
        setIsGenerating(true)
        if(outlines.length=== 0){
            toast.error('ERROR',{
                description:'Please add at least one card to generate slides',
            })
            return
        }
        try {
            const res = await createProject(currentAiPrompt,outlines.slice(0,noOfCards))
        
        if(res.status !== 200 || !res.data){
            throw new Error('Unable to create project')
        }
        router.push(`/presentation/${res.data.id}/select-theme`)
        setProject(res.data)
        addPrompt({
            id:v4(),
            title: currentAiPrompt || outlines?.[0]?.title,
            outlines:outlines,
            createdAt : new Date().toISOString(),
        })
        toast.success('Success',{
            description: 'Project created successfully! ',
        })
        setCurrentAiPrompt('')
        resetOutlines()


        }catch (error) {
            console.log(error)
            toast.error('Error',{
                description:'Failed to create project'
            })

        } finally {
            setIsGenerating(false)
        }

    }

    useEffect(()=> {
        setNoOfCards(outlines.length)
     },[outlines.length])



  return (
    <motion.div className='space-y-6 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'
    variants={containerVariants}
    initial='hidden'
    animate='visible'>
        <Button onClick={handleBack}
        variant='outline'
        className='mb-4'>
            <ChevronLeft className='mr-2 h-4 w-4'></ChevronLeft>
            Back
        </Button>
        <motion.div variants={itemVariants}
        className='text-center space-y-2'>
            <h1 className='text-4xl font-bold text-primary'>
                Generate with <span className='text-vivid'>Creative AI</span>
            </h1>
            <p className='text-muted-white'> What would like to create today ?</p>
        </motion.div>
        <motion.div className='bg-primary/10 p-4 rounded-xl' variants={itemVariants}>
        <div className='flex flex-col sm:flex-row justify-between gap-3 items-center rounded-xl'>
            <Input 
            placeholder='Enter Prompt and add to the cards ... '
            className='text-base sm:text-xl border-0 focus-visible:ring-0 shadow-none p-0 bg-transparent flex-grow' required value={currentAiPrompt || ''} onChange={(e)=>setCurrentAiPrompt(e.target.value)}/>  
            <div className='flex items-center gap-3'>
                <Select value={noOfCards.toString()}
                onValueChange={(value) => setNoOfCards(parseInt(value))}>
                <SelectTrigger className='w-fit gap-2 font-semibold shadow-xl'>
                    <SelectValue placeholder="Select number of cards " />
                </SelectTrigger>
              <SelectContent className='w-fit'>
  {Array.from({ length: 6 }, (_, idx) => idx + 1).map((num) => (
    <SelectItem key={num} value={num.toString()} className='font-semibold'>
      {num} {num === 1 ? 'Card' : 'Cards'}
    </SelectItem>
  ))}
</SelectContent>
                
                </Select>
            <Button variant='destructive'
            onClick={resetCards}
            size='icon'
            aria-label='Reset cards'>
                <RotateCcw className='h-4 w-4'></RotateCcw>
            </Button>
            </div>  
        </div></motion.div>
        <div className='w-full flex justify-center items-center'>
            <Button className='font-medium text-lg flex gap-2 items-center'
            onClick={generateOutline}
            disabled={isGenerating}>
                {isGenerating ? (
                    <>
                    <Loader2 className='animate-spin mr-2'/>Generating ...
                    </>
                ) : ('Generate Outline')}
            </Button>
        </div>

        <CardList outlines={outlines} addOutline={addOutline} addMultipleOutlines={addMultipleOutlines} editingCard={editingCard} selectedCard={selectedCard} editText={editText} onEditChange={setEditText} onCardSelect={setSelectedCard} setEditText={setEditText} setEditingCard={setEditingCard} setSelectedCard={setSelectedCard} onCardDoubleClick={(id,title)=> {
            setEditingCard(id),
            setEditText(title)
        }}/>
        {outlines.length > 0 && ( <Button className='w-full' onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating?  
            (<>
            <Loader2 className='animate-spin mr-2'/> Generating...
            </>
            )
            : ( 
                "Generate "

            )}</Button>)}

            {prompts?.length >0  && <RecentPrompts/>}
    </motion.div>
  )
}

export default CreateAI