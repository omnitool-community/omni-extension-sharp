// Copyright (c) 2023 MERCENARIES.AI PTE. LTD.
// All rights reserved.

import { OAIBaseComponent, WorkerContext, OmniComponentMacroTypes } from 'omni-sockets'
import sharp from 'sharp'
import writeToCdn from '../util/writeToCdn'

const NS_OMNI = 'sharp'

// SharpFormatChangeComponent
let formatChangeComponent = OAIBaseComponent.create(NS_OMNI, 'formatChange')
  .fromScratch()
  .set('title', 'Change Image Format (Sharp)')
  .set('category', 'Image Manipulation')
  .set('description', 'Changes an image format')
  .setMethod('X-CUSTOM')
  .setMeta({
    source: {
      summary: 'Change image format using Sharp',
      links: {
        'Sharp Website': 'https://sharp.pixelplumbing.com/',
        'Documentation': 'https://sharp.pixelplumbing.com/api-output',
        'Sharp Github': 'https://github.com/lovell/sharp'
      }
    }
  })

  formatChangeComponent.addInput(
    formatChangeComponent.createInput('images', 'object', 'image', {array: true})
      .set('title', 'Image')
      .set('description', 'The image(s) to convert')
      .allowMultiple(true)
      .setRequired(true)
      .toOmniIO()
  )
  .addInput(
    formatChangeComponent.createInput('format', 'string')
      .set('description', 'Target format (png, jpeg, webp, etc.)')
      .setChoices(['heif', 'avif', 'jpeg', 'tile', 'png', 'raw', 'tiff', 'webp', 'gif', 'jp2', 'jxl'], 'png')
      .setRequired(true)
      .toOmniIO()
  )
  .addOutput(
    formatChangeComponent.createOutput('images', 'object', 'image', {array: true})
      .set('title', 'Images')
      .set('description', 'The converted images')
      .toOmniIO()
  )
  .setMacro(OmniComponentMacroTypes.EXEC, async (payload: any, ctx: WorkerContext) => {
    if (payload.images) {
      let images = await Promise.all(payload.images.map((image: any) => {
        return ctx.app.cdn.get(image.ticket)
      }))

      let results = await Promise.all(images.map(async (image: any) => {
        let buffer = image.data
        let result = await sharp(buffer).toFormat(payload.format).toBuffer()
        image.data = result
        return image
      }))

      payload.images = await writeToCdn(ctx, results)
    }
    return { images: payload.images }
  })

const SharpFormatChangeComponent = formatChangeComponent.toJSON()
export default SharpFormatChangeComponent
